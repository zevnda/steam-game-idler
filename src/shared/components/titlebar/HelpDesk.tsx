import type { SignedInAccount } from '@/shared/stores/sessionStore'
import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useAccountSummaryStore } from '@/shared/stores/accountSummaryStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'
import { isPortableCheck } from '@/shared/utils/update'

const LICENSE_KEY_STORAGE_KEY = 'licenseKey'

// Chatway (see `_app.tsx`'s script injection) attaches this global once its widget script has
// loaded - there's no npm package/type definition for it, so the shape is declared here, matching
// `main`'s identical declaration (the only place either codebase touches this global).
declare global {
  interface Window {
    $chatway?: {
      openChatwayWidget: () => void
      closeChatwayWidget: () => void
      updateChatwayCustomData: (key: string, value: string) => void
    }
  }
}

// Mirrors `useCheckSubscription.ts`'s `resolveSteamId` - local mode already has a SteamID64, agent
// mode needs the backend to resolve one from its live session.
async function resolveSteamId(account: SignedInAccount) {
  if (account.mode === 'local') return account.steamId
  return invoke<string>('resolve_account_steam_id', { account })
}

// Titlebar launcher for the Chatway live-chat widget (script unconditionally injected in
// `_app.tsx`, its own default floating icon hidden so this is the only trigger). Casual-tier gated
// - ported from `main`'s `HelpDesk.tsx`, same widget ID, intentionally reusing `main`'s live
// support account.
export const HelpDesk = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const account = useSessionStore(state => state.account)
  const summaries = useAccountSummaryStore(state => state.summaries)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)

  const personaName = account ? summaries[getAccountKey(account)]?.personaName : undefined

  // Chatway's widget script mounts its container asynchronously and well after this component
  // itself - poll (matching `main`) rather than relying on a load event the script doesn't expose.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.querySelector('.chatway--container.has-loaded')) {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }, 300)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const widget = document.querySelector('.chatway--container')
    if (!widget) return

    const observer = new MutationObserver(() => {
      setIsOpen(widget.classList.contains('widget--open'))
    })
    observer.observe(widget, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    const trigger = document.getElementById('chatway_widget_trigger')
    if (!trigger) return

    const checkUnread = () => {
      setHasUnread(Number(trigger.getAttribute('data-unread-message') || '0') > 0)
    }
    checkUnread()

    const observer = new MutationObserver(checkUnread)
    observer.observe(trigger, {
      attributes: true,
      attributeFilter: ['data-unread-message', 'class'],
    })
    return () => observer.disconnect()
  }, [isLoaded])

  const pushCustomData = async () => {
    if (!account || !personaName || typeof window === 'undefined' || !window.$chatway) return

    const [steamId, version, isPortable] = await Promise.all([
      resolveSteamId(account),
      getVersion(),
      isPortableCheck(),
    ])
    const licenseKey = localStorage.getItem(LICENSE_KEY_STORAGE_KEY) ?? 'N/A (legacy subscriber)'
    const tierLabel = subscriptionTier
      ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)
      : 'Free'

    window.$chatway.updateChatwayCustomData(
      'name',
      `${personaName} (${steamId}, v${version}, ${tierLabel}, ${isPortable ? 'Portable' : 'Installer'}, ${licenseKey})`,
    )
  }

  const handleToggle = async () => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatway) return

    const widget = document.querySelector('.chatway--container')
    if (widget?.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
    } else {
      await pushCustomData()
      window.$chatway.openChatwayWidget()
    }
    setHasUnread(false)
  }

  const handleClose = () => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatway) return
    const widget = document.querySelector('.chatway--container')
    if (widget?.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
      setIsOpen(false)
    }
  }

  if (!hasCasualAccess(subscriptionTier)) return null

  return (
    <>
      {/* `bg-backdrop` is the exact token HeroUI's own Modal/Popover/AlertDialog backdrops use
          (`--color-backdrop` -> `--backdrop`, rgba(0,0,0,.5) light / .6 dark) - baking the
          transparency into the color itself, not a separate `opacity` utility, matters here:
          `.overlay-fade-in`'s keyframe also animates the `opacity` property, and a static
          `opacity-*` utility on the same element would be overridden by the animation's own final
          `opacity: 1` state, rendering as fully solid black instead of a translucent backdrop (a
          real bug this fixed - `bg-black opacity-50` + the fade-in keyframe together resolved to
          opaque black). `.overlay-fade-in` (globals.css) is the plain-CSS entrance this codebase
          substitutes for `main`'s framer-motion `AnimatePresence` fade - already dropped
          project-wide, matching HeroUI's own 150ms backdrop entrance
          timing rather than GoProModal's much slower 500ms `pro-fade-in`. No exit fade, same
          accepted tradeoff as other CSS-only replacements. `z-9998` matches SplashScreen's full-
          viewport overlay convention - above Titlebar (z-50) and every dashboard route, below
          Chatway's own widget chrome. */}
      {isOpen && (
        <div className='overlay-fade-in fixed inset-0 z-9998 bg-backdrop' onClick={handleClose} />
      )}

      <AppTooltip.Root delay={300}>
        <AppTooltip.Trigger>
          <button
            type='button'
            aria-label={t('titlebar.helpDesk')}
            className='relative flex h-14 w-12 items-center justify-center text-foreground cursor-pointer outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
            onClick={handleToggle}
          >
            <RiCustomerService2Line fontSize={18} />
            {hasUnread && (
              <span className='absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger' />
            )}
          </button>
        </AppTooltip.Trigger>
        <AppTooltip.Content placement='bottom'>{t('titlebar.helpDesk')}</AppTooltip.Content>
      </AppTooltip.Root>
    </>
  )
}
