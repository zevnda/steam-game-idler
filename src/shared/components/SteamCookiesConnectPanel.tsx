import type { SteamCookiesLike } from '@/shared/stores/steamCookiesStore'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbExternalLink } from 'react-icons/tb'
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
  toast,
  Typography,
} from '@heroui/react'
import { TierBadge } from '@/shared/components/TierBadge'
import { useSavedSteamCookies } from '@/shared/hooks/useSavedSteamCookies'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'
import { showErrorToast } from '@/shared/utils/showErrorToast'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Single source of truth for the Steam Credentials docs link - shared by every surface that shows
// a "Learn more" button pointing at it (SteamCredentialsTab's own embedded title row, and this
// component's standalone-variant title row via `showLearnMoreLink`) so the URL only lives in one
// place.
export const STEAM_CREDENTIALS_DOCS_URL = 'https://steamgameidler.com/docs/steam-credentials'

// Where the manual-entry tab's "get your cookies from" note links to - the cookies themselves are
// only readable from a Steam Community page's own cookie jar, so this just points at the site
// itself rather than any particular sub-page.
const STEAM_COMMUNITY_URL = 'https://steamcommunity.com/'

type CookieMethod = 'automatic' | 'manual'

interface SteamCookiesConnectPanelProps<T extends SteamCookiesLike> {
  // Only rendered in the default 'standalone' variant (AuthCard's heading) - 'embedded' skips
  // both, since that caller (SteamCredentialsTab) already renders its own heading row above this
  // component, including its own "Learn more" docs link (see `showLearnMoreLink`'s doc comment
  // for why that tab renders its own instead of reusing this component's title row).
  title?: ReactNode
  // 'standalone' (default): centered, max-width card with its own title/description - a full
  // pre-dashboard-style connect prompt (CardFarmingStartPanel/InventoryConnectPanel). 'embedded':
  // no AuthCard/centering wrapper, just the error slot/tabs/form/buttons at the host's own width -
  // for mounting inside an already-chrome'd container (SteamCredentialsTab, inside the Settings
  // modal's tab panel).
  variant?: 'standalone' | 'embedded'
  automaticTabLabel: string
  manualTabLabel: string
  automaticDescription: string
  savedCredentialsNote: string
  isSubmitting: boolean
  errorSlot?: ReactNode
  // Shows a "Clear" button (next to Submit) once a saved cookie set exists, wired to this
  // component's own `useSavedSteamCookies().clear()` - the single shared implementation for all
  // three surfaces (previously SteamCredentialsTab hand-rolled an identical copy). Off by default
  // since CardFarmingStartPanel/InventoryConnectPanel only opted in once Settings' Clear button
  // became the template for parity - see this component's own doc comment.
  showClear?: boolean
  // Adds a "Learn more" docs-link button next to the title, in the same spot/style as
  // SteamCredentialsTab's own embedded title row (see `variant`'s doc comment for why that tab
  // renders its own instead of using this prop). Only meaningful for the 'standalone' variant -
  // 'embedded' has no title row of its own here for it to attach to.
  showLearnMoreLink?: boolean
  // Toasts "Credentials saved"/"Credentials cleared" on a successful submit/clear - only
  // SteamCredentialsTab needs this: a Settings save/clear has no other visible feedback (the tab
  // just stays put), whereas CardFarmingStartPanel/InventoryConnectPanel's successful connect
  // already has its own feedback (the page transitions off the connect panel entirely), so a toast
  // on top would be redundant chrome.
  showSuccessToast?: boolean
  // Skips this component's own post-connect `save()` call for a successful manual submit - only
  // SteamCredentialsTab needs this: its `onConnect` (routed to `validate_and_save_steam_credentials`)
  // already persists Rust-side and updates the shared cookie store itself, so this component's own
  // `save()` afterward would just be a redundant second write of the identical values.
  skipAutoSave?: boolean
  // Validates whichever cookies were supplied against the caller's own feature-specific fetch
  // (`get_games_with_drops`/`get_inventory`, both routed through `session::resolve`'s Rust-side
  // validation) - deliberately does NOT start anything feature-specific beyond proving the cookies
  // work. `handleSubmit` only persists a manual cookie set (`save`) once this confirms it's real,
  // so an incorrect paste is never written to the credential store.
  onConnect: (manualCookies: T | undefined) => Promise<boolean>
}

// Shared shell for every "connect via Steam Community cookies" prompt - Card Farming's connect
// panel, Inventory Manager's connect panel, and the Settings modal's Steam Credentials tab (folded
// in 2026-07-18, see `variant`'s doc comment for how it adapts to that tab's embedded layout) - so
// entering/clearing cookies looks and behaves identically everywhere instead of three hand-synced
// near-duplicates. Always shows both the automatic (gamer-tier) and manual tabs, rather than hiding
// automatic entirely for a non-gamer account: the automatic tab stays a real, selectable `Tab`
// (never `isDisabled`), just intercepted in `onSelectionChange` to open the pro modal instead of
// switching tabs when gated - mirrors `InventoryPageHeader`'s "Sell Dupes" button gate. Deliberately
// just a **connect** step - it never starts/fetches anything feature-specific itself, only
// validates+persists cookies via the caller's `onConnect`.
//
// Also backed by `useSavedSteamCookies` so the manual form prefills from (and saves back to) the
// same OS-credential-store cookie set every surface shares - entering or clearing cookies on any
// one of these three screens makes that visible on the others too.
export function SteamCookiesConnectPanel<T extends SteamCookiesLike>({
  title,
  variant = 'standalone',
  automaticTabLabel,
  manualTabLabel,
  automaticDescription,
  savedCredentialsNote,
  isSubmitting,
  errorSlot,
  showClear = false,
  showLearnMoreLink = false,
  showSuccessToast = false,
  skipAutoSave = false,
  onConnect,
}: SteamCookiesConnectPanelProps<T>) {
  const { t } = useTranslation()
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canUseAutomatic = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const { savedCookies, isLoaded, save, clear } = useSavedSteamCookies<T>()
  const [method, setMethod] = useState<CookieMethod>(canUseAutomatic ? 'automatic' : 'manual')
  const [cookiesForm, setCookiesForm] = useState(EMPTY_MANUAL_COOKIES_FORM_VALUE)
  const [prefilledFromSaved, setPrefilledFromSaved] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

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
      setCookiesForm({ sls: savedCookies.sls, sma: savedCookies.sma ?? '' })
      setPrefilledFromSaved(true)
    } else if (!savedCookies && prefilledFromSaved) {
      setCookiesForm(EMPTY_MANUAL_COOKIES_FORM_VALUE)
      setPrefilledFromSaved(false)
    }
  }, [isLoaded, savedCookies, prefilledFromSaved])

  const canSubmitManual = cookiesForm.sls.trim() !== ''
  const canSubmit = method === 'automatic' || canSubmitManual
  const submitLabel = method === 'automatic' ? t('common.actions.signIn') : t('common.actions.save')

  // Manual cookies are only ever persisted (`save`) once `onConnect` has actually proven they
  // authenticate, so a mistyped or stale paste never sits in the credential store. Automatic-path
  // cookies are never saved from this component's own `save()` (Settings' "Automatic" tab persists
  // its own result via `onAcquire`/`onConnect` itself instead - see `skipAutoSave`'s doc comment).
  const handleSubmit = async () => {
    if (method === 'automatic') {
      // Re-checks `canUseAutomatic` here, not just at tab-selection time - `method` is local UI
      // state that isn't kept in sync with a live subscription downgrade, so a panel left open with
      // "automatic" already selected across a downgrade could otherwise still submit that path once.
      if (!canUseAutomatic) {
        openProModalWithTier('gamer')
        return
      }
      const ok = await onConnect(undefined)
      if (ok && showSuccessToast) toast.success(t('common.manualCookies.savedToast'))
      return
    }
    const manualCookies = {
      // The backend mints its own `sessionid` for every manually-supplied cookie set (see
      // `session::resolve`'s Rust-side doc comment) - this placeholder is never actually used.
      sid: '',
      sls: cookiesForm.sls.trim(),
      sma: cookiesForm.sma.trim() || undefined,
    } as T
    const ok = await onConnect(manualCookies)
    if (ok) {
      if (!skipAutoSave) save(manualCookies)
      if (showSuccessToast) toast.success(t('common.manualCookies.savedToast'))
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

  // Wipes whatever's currently saved for this account (`clear_steam_credentials`) and resets the
  // form back to empty - the one shared implementation every surface's Clear button now calls,
  // rather than each hand-rolling `invoke('clear_steam_credentials', ...)` itself. A clear failure
  // (a credential-store IO error - rare) gets a generic toast rather than routing through the
  // caller's own feature-specific `errorSlot`/error-code mapping, since `clear_steam_credentials`
  // only ever throws one code (`steam_credentials_store_io_failed`) and every surface would show
  // the exact same text for it anyway. Unlike `handleSubmit`'s save-success toast, this one always
  // fires regardless of `showSuccessToast` - CardFarmingStartPanel/InventoryConnectPanel's connect
  // success has its own strong feedback (the page transitions off the connect panel entirely), but
  // a successful Clear only blanks the form fields, which alone doesn't distinguish "the stored
  // credential is actually gone" from "the fields just got reset for some other reason" on any
  // surface, not just Settings.
  const handleClear = async () => {
    setIsClearing(true)
    const errorCode = await clear()
    setIsClearing(false)
    if (errorCode) {
      showErrorToast(
        t('common.manualCookies.clearFailed', { code: errorCode }),
        errorCode,
        t('common.learnMore'),
      )
      return
    }
    setCookiesForm(EMPTY_MANUAL_COOKIES_FORM_VALUE)
    setPrefilledFromSaved(false)
    toast.success(t('common.manualCookies.clearedToast'))
  }

  const manualForm = (
    <>
      <Typography color='muted' type='body-xs'>
        {t('common.manualCookies.getCookiesNote')}{' '}
        <button
          type='button'
          className='inline-flex cursor-pointer items-center gap-1 text-accent hover:text-accent/80 duration-150'
          onClick={() => openExternalLink(STEAM_COMMUNITY_URL)}
        >
          {STEAM_COMMUNITY_URL}
          <TbExternalLink fontSize={12} />
        </button>
      </Typography>
      {prefilledFromSaved && (
        <Typography color='muted' type='body-xs'>
          {savedCredentialsNote}
        </Typography>
      )}
      <ManualCookiesForm isDisabled={isSubmitting} value={cookiesForm} onChange={setCookiesForm} />
    </>
  )

  const content = (
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

      <div className='flex items-center gap-3'>
        {showClear && savedCookies && (
          <Button
            size='sm'
            isDisabled={isSubmitting}
            isPending={isClearing}
            variant='secondary'
            onPress={handleClear}
          >
            {t('common.actions.clear')}
          </Button>
        )}
        <Button
          size='sm'
          isDisabled={!canSubmit || isClearing}
          isPending={isSubmitting}
          onPress={handleSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )

  if (variant === 'embedded') {
    return content
  }

  return (
    <div className='w-full max-w-lg p-8'>
      <AuthCard
        className='w-full'
        title={title}
        titleAction={
          showLearnMoreLink ? (
            <Button
              className='inline-flex shrink-0 items-center gap-1 text-sm duration-150 cursor-pointer'
              size='sm'
              type='button'
              variant='secondary'
              onClick={() => openExternalLink(STEAM_CREDENTIALS_DOCS_URL)}
            >
              {t('common.learnMore')}
              <TbExternalLink fontSize={14} />
            </Button>
          ) : undefined
        }
      >
        {content}
      </AuthCard>
    </div>
  )
}
