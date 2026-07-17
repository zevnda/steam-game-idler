import type { SteamCookiesLike } from '@/shared/stores/steamCookiesStore'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthCard from './AuthCard'
import { EMPTY_MANUAL_COOKIES_FORM_VALUE, ManualCookiesForm } from './ManualCookiesForm'
import {
  Button,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabPanel,
  TabsRoot,
  Typography,
} from '@heroui/react'
import { TierBadge } from '@/shared/components/TierBadge'
import { useSavedSteamCookies } from '@/shared/hooks/useSavedSteamCookies'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

type CookieMethod = 'automatic' | 'manual'

interface SteamCookiesConnectPanelProps<T extends SteamCookiesLike> {
  title: ReactNode
  description: ReactNode
  automaticTabLabel: string
  manualTabLabel: string
  automaticDescription: string
  savedCredentialsNote: string
  isSubmitting: boolean
  errorSlot?: ReactNode
  // Validates whichever cookies were supplied against the caller's own feature-specific fetch
  // (`get_games_with_drops`/`get_inventory`, both routed through `session::resolve`'s Rust-side
  // validation) - deliberately does NOT start anything feature-specific beyond proving the cookies
  // work. `handleSubmit` only persists a manual cookie set (`save`) once this confirms it's real,
  // so an incorrect paste is never written to the credential store.
  onConnect: (manualCookies: T | undefined) => Promise<boolean>
}

// Shared shell for every "connect via Steam Community cookies" prompt (Card Farming's connect
// panel, Inventory Manager's connect panel) - always shows both the automatic (gamer-tier) and
// manual tabs, rather than hiding automatic entirely for a non-gamer account: the automatic tab
// stays a real, selectable `Tab` (never `isDisabled`), just intercepted in `onSelectionChange` to
// open the pro modal instead of switching tabs when gated - mirrors `InventoryPageHeader`'s "Sell
// Dupes" button gate. Deliberately just a **connect** step - it never starts/fetches anything
// feature-specific itself, only validates+persists cookies via the caller's `onConnect`.
//
// Also backed by `useSavedSteamCookies` so the manual form prefills from (and saves back to) the
// same OS-credential-store cookie set the Settings modal's Steam Credentials tab manages - entering
// cookies on any one of these three surfaces makes them available on the others too.
export function SteamCookiesConnectPanel<T extends SteamCookiesLike>({
  title,
  description,
  automaticTabLabel,
  manualTabLabel,
  automaticDescription,
  savedCredentialsNote,
  isSubmitting,
  errorSlot,
  onConnect,
}: SteamCookiesConnectPanelProps<T>) {
  const { t } = useTranslation()
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canUseAutomatic = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const { savedCookies, isLoaded, save } = useSavedSteamCookies<T>()
  const [method, setMethod] = useState<CookieMethod>(canUseAutomatic ? 'automatic' : 'manual')
  const [cookiesForm, setCookiesForm] = useState(EMPTY_MANUAL_COOKIES_FORM_VALUE)
  const [prefilledFromSaved, setPrefilledFromSaved] = useState(false)

  // Prefills once per load, not on every `savedCookies` identity change - same "sync once" pattern
  // as SteamCredentialsTab's own effect. Doesn't overwrite anything the user's already typed.
  //
  // Also clears back to empty if `savedCookies` disappears out from under an already-prefilled
  // form - a session-expiry detection (`session::ensure_valid`/mid-cycle scraper check) clears
  // the credential store (and this store's cached copy via `clearSavedSteamCookiesByKey`) while
  // this panel can still be mounted showing the now-dead value, so without this branch the fields
  // would keep silently displaying credentials the backend has already discarded. Guarded on
  // `prefilledFromSaved` rather than firing whenever `savedCookies` is falsy - that's also the
  // normal state for a first-time user who's mid-typing a brand-new set that never came from a
  // prefill, and blowing that away would be wrong.
  useEffect(() => {
    if (!isLoaded) return
    if (savedCookies && !prefilledFromSaved) {
      setCookiesForm({ sid: savedCookies.sid, sls: savedCookies.sls, sma: savedCookies.sma ?? '' })
      setPrefilledFromSaved(true)
    } else if (!savedCookies && prefilledFromSaved) {
      setCookiesForm(EMPTY_MANUAL_COOKIES_FORM_VALUE)
      setPrefilledFromSaved(false)
    }
  }, [isLoaded, savedCookies, prefilledFromSaved])

  const canSubmitManual = cookiesForm.sid.trim() !== '' && cookiesForm.sls.trim() !== ''
  const canSubmit = method === 'automatic' || canSubmitManual
  const submitLabel = method === 'automatic' ? t('common.actions.signIn') : t('common.actions.save')

  // Manual cookies are only ever persisted (`save`) once `onConnect` has actually proven they
  // authenticate, so a mistyped or stale paste never sits in the credential store. Automatic-path
  // cookies are never saved from this panel (Settings' "Automatic" tab is the only surface that
  // persists those).
  const handleSubmit = async () => {
    if (method === 'automatic') {
      // Re-checks `canUseAutomatic` here, not just at tab-selection time - `method` is local UI
      // state that isn't kept in sync with a live subscription downgrade, so a panel left open with
      // "automatic" already selected across a downgrade could otherwise still submit that path once.
      if (!canUseAutomatic) {
        openProModalWithTier('gamer')
        return
      }
      await onConnect(undefined)
      return
    }
    const manualCookies = {
      sid: cookiesForm.sid.trim(),
      sls: cookiesForm.sls.trim(),
      sma: cookiesForm.sma.trim() || undefined,
    } as T
    const ok = await onConnect(manualCookies)
    if (ok) {
      save(manualCookies)
    } else {
      // A failed submit means these exact values are confirmed not to work right now - never leave
      // them sitting in the form looking like they might still be fine. Force a genuine re-entry
      // rather than a "maybe just retry the same paste" state, matching this app's "notify, clear,
      // reenter" pattern for a dead/invalid credential elsewhere (steamCommunitySessionExpired.ts).
      // Unconditional on the specific error code - the effect above only catches a value that was
      // *previously* saved-and-valid going bad later; a fresh, never-saved attempt failing has no
      // `savedCookies` transition for that effect to react to at all, so this has to clear directly.
      setCookiesForm(EMPTY_MANUAL_COOKIES_FORM_VALUE)
      setPrefilledFromSaved(false)
    }
  }

  const manualForm = (
    <>
      {prefilledFromSaved && (
        <Typography color='muted' type='body-xs'>
          {savedCredentialsNote}
        </Typography>
      )}
      <ManualCookiesForm isDisabled={isSubmitting} value={cookiesForm} onChange={setCookiesForm} />
    </>
  )

  return (
    <div className='w-full max-w-md p-8'>
      <AuthCard className='w-full' description={description} title={title}>
        <div className='flex flex-col gap-4'>
          {errorSlot}

          <TabsRoot
            selectedKey={method}
            onSelectionChange={key => {
              if (key === 'automatic' && !canUseAutomatic) {
                openProModalWithTier('gamer')
                return
              }
              setMethod(key as CookieMethod)
            }}
          >
            <TabListContainer>
              <TabList>
                <Tab className={!canUseAutomatic ? 'opacity-60' : undefined} id='automatic'>
                  <span className='inline-flex items-center gap-1.5'>
                    {automaticTabLabel}
                    {!canUseAutomatic && <TierBadge tier='gamer' />}
                  </span>
                  <TabIndicator />
                </Tab>
                <Tab id='manual'>
                  {manualTabLabel}
                  <TabIndicator />
                </Tab>
              </TabList>
            </TabListContainer>
            <TabPanel className='pt-4' id='automatic'>
              <Typography color='muted' type='body-sm'>
                {automaticDescription}
              </Typography>
            </TabPanel>
            <TabPanel className='flex flex-col gap-3 pt-4' id='manual'>
              {manualForm}
            </TabPanel>
          </TabsRoot>

          <Button isDisabled={!canSubmit} isPending={isSubmitting} onPress={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      </AuthCard>
    </div>
  )
}
