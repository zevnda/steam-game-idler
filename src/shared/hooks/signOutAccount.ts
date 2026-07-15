import type { AccountKey } from '@/shared/stores/sessionStore'
import { useAccountSummaryStore } from '@/shared/stores/accountSummaryStore'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { resetSubscription } from '@/shared/utils/subscriptionApi'

// Signs out one account by key, agnostic of whether it's the active one or a backgrounded one -
// the only sign-out entry point in the app (see the account switcher and AccountSwitcher.tsx,
// which drives the confirm-dialog-when-automation-is-running decision itself, rather than this
// function knowing about UI at all). Always stops card farming and the achievement unlocker first
// (see the inline comment below for why), then logs an agent-mode session off cleanly via
// `agent_logout`; a local-mode account instead stops its idle processes via `stop_all_idling`
// (already scoped to just this account via IdleClaimsRegistry).
//
// Deliberately does **not** call the blanket `kill_all_steam_utility_processes` unless this was
// the *last* signed-in account - that command is a whole-app kill that would silently kill every
// *other* concurrently signed-in account's process too. Only called now as a last-resort safety
// net once nothing is left signed in.
export async function signOutAccount(key: AccountKey) {
  const account = useSessionStore.getState().accounts[key]
  let cleanupFailed = false

  if (account) {
    // Stop card farming / achievement unlocker before the mode-specific step below - both stop
    // commands resolve the account's SteamID64 via the still-live agent session for agent-mode
    // accounts, so they'd fail with SessionNotFound if run after `agent_logout` tears that session
    // down. Concurrent + allSettled so one stuck/failing stop doesn't block the other or the
    // sign-out itself.
    const stopResults = await Promise.allSettled([
      invoke('stop_farming', { account }),
      invoke('stop_achievement_unlocker', { account }),
    ])
    for (const result of stopResults) {
      if (result.status === 'rejected') {
        console.error('Error stopping automation during sign-out:', result.reason)
        cleanupFailed = true
      }
    }

    try {
      if (account.mode === 'agent') {
        await invoke('agent_logout', { username: account.username })
      } else {
        await invoke('stop_all_idling', { account })
      }
    } catch (error) {
      console.error('Error signing out account:', error)
      cleanupFailed = true
    }
  }

  // Reset before the caller navigates/re-renders, not left for the next sign-in's sync hooks to
  // overwrite - avoids a brief flash of the previous account's data if a different account signs in
  // next. Only this account's entry is dropped from each store, not the whole cache - other
  // signed-in accounts' idling state/fetched games survive a sign-out that isn't theirs.
  useIdlingStore.getState().clearEntry(key)
  useGamesListStore.getState().clearEntry(key)
  useCardFarmingStore.getState().clearEntry(key)
  useAchievementUnlockerStore.getState().clearEntry(key)
  useAccountSummaryStore.getState().clearSummary(key)
  useSessionStore.getState().clearAccount(key)

  const accountsRemaining = Object.keys(useSessionStore.getState().accounts).length
  logFrontendInfo('signOutAccount', 'account signed out', {
    mode: account?.mode ?? null,
    accountsRemaining,
  })
  if (accountsRemaining === 0) {
    // Subscriptions are app-wide (see resetSubscription's doc comment), so this only resets to
    // "unknown" once nothing is left signed in - switching to a remaining account keeps whatever
    // tier was last confirmed, which is still correct since it's the same device-wide license.
    resetSubscription()

    try {
      await invoke('kill_all_steam_utility_processes')
    } catch (error) {
      console.error('Error in (kill_all_steam_utility_processes):', error)
      cleanupFailed = true
    }
  }

  return { accountsRemaining, cleanupFailed }
}
