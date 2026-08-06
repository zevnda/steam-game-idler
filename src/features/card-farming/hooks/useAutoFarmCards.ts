import type { CardFarmingSettings, FarmingState, SteamCookies } from '../types'
import { useEffect } from 'react'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSteamCookiesStore } from '@/shared/stores/steamCookiesStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { clearSavedSteamCookies } from '@/shared/utils/steamCommunitySessionExpired'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// How often to check whether farming should auto-start. Deliberately coarse - this is scanning for
// whether to *start* a cycle, not tracking a running one's progress, so it can afford to be far
// less aggressive against steamcommunity.com than the cycle's own internal pacing.
const AUTO_FARM_CHECK_INTERVAL_MS = 15 * 60 * 1000

// Gamer-tier automation: periodically checks whether farming should auto-start for the active
// account - mirrors `useFreeGamesWatcher.ts`'s shape: poll immediately, then on a fixed interval,
// with every condition re-read fresh via `getState()` inside the tick so a tier lapse/sign-out/
// account switch is honored on the next tick. `start_farming` now fully self-resolves everything
// (whitelist scope, filters, phase - see `card_farming::manager`'s module doc comment), so this
// hook only needs to decide *whether* to call it, not build anything for it first.
//
// The gamer-tier gate applies to any sign-in mode, but which cookies this loop uses differs: agent
// mode always resolves silently from the daemon's live SteamKit2 session (no UI path exists here at
// all); CLI mode only reuses cookies already saved in `steamCookiesStore`, never falling back to
// the automatic-acquisition webview - a CLI-mode account with no saved cookies simply isn't
// auto-farmed until the user connects once from the page itself.
//
// Only ever considers the currently *active* account, same scope limit
// `useCardFarmingSync`/`useGamesListSync`/`useIdlingSync` already established. No cooldown after a
// manual "Stop" - the next tick just sees `isFarming: false` again and restarts.
export const useAutoFarmCards = () => {
  useEffect(() => {
    const check = async () => {
      const account = useSessionStore.getState().account
      const subscriptionTier = useSubscriptionStore.getState().subscriptionTier
      if (!account || !hasGamerAccess(subscriptionTier)) return
      if (useCardFarmingStore.getState().state.isFarming) return

      // CLI mode: only ever reuse already-resolved saved cookies - see this hook's doc comment for
      // why acquisition is never attempted from here. Skips the tick entirely (not an error) if the
      // one-time-per-account check (`useSteamCookiesSync`) hasn't resolved yet, or resolved to
      // nothing saved.
      let manualCookies: SteamCookies | null = null
      if (account.mode !== 'agent') {
        const entry = useSteamCookiesStore.getState().entries[getAccountKey(account)]
        if (!entry?.isChecked || !entry.savedCookies) return
        manualCookies = entry.savedCookies as SteamCookies
      }

      try {
        const settings = await invoke<CardFarmingSettings>('get_card_farming_settings', {
          account,
        })
        if (!settings.autoFarmCards) return

        const state = await invoke<FarmingState>('start_farming', { account, manualCookies })
        useCardFarmingStore.getState().updateState(getAccountKey(account), state)
        logFrontendInfo('useAutoFarmCards', 'auto-started card farming')
      } catch (error) {
        console.error('Error in (useAutoFarmCards check):', error)
        // A session failure for a CLI-mode account's saved cookies - Rust already cleared the
        // OS-credential-store copy for a confirmed `expired` (see `ensure_valid`'s doc comment),
        // but `steamCookiesStore`'s own client-side cache doesn't know that on its own; clearing it
        // here stops this loop from silently retrying the same dead cookies every tick until the
        // user reconnects manually. Also covers `failed` (deliberately transient on the Rust side,
        // see `SessionStatus::Inconclusive`) - in practice even a genuine, permanent Steam-side
        // sign-out often surfaces as `failed` rather than a definitive `expired`, so treating only
        // `expired` this way left this loop retrying real dead cookies indefinitely (see
        // useCardFarming.ts's identical `isSessionCode` handling for the full reasoning).
        const code = String(error)
        if (
          account.mode !== 'agent' &&
          (code === 'steam_community_session_expired' || code === 'steam_community_session_failed')
        ) {
          clearSavedSteamCookies(account)
        }
      }
    }

    check()
    const interval = setInterval(check, AUTO_FARM_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])
}
