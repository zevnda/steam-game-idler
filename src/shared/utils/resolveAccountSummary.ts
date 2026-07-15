import type { SteamPlayerSummaryResponse } from '@/features/local-sign-in/types'
import type { AccountSummary } from '@/shared/stores/accountSummaryStore'
import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'
import { useAccountSummaryStore } from '@/shared/stores/accountSummaryStore'
import { invoke } from '@/shared/utils/invoke'

// Steam only serves a small thumbnail by default - same upgrade `mergeAccounts.ts` (local-sign-in)
// already applies to its own transient fetch.
const toFullResAvatar = (avatar: string) => avatar.replace('.jpg', '_full.jpg')

// Module-scope so useAccountSummaries.ts's background pass and AddAccountModal.tsx's awaited call
// (fired for the same brand-new key on the same render) share one in-flight request instead of
// both hitting resolve_account_steam_id/get_user_summary independently.
const inFlight = new Map<AccountKey, Promise<AccountSummary | null>>()

// Persona name + avatar lookup shared by useAccountSummaries.ts (background resolution for every
// signed-in account) and AddAccountModal.tsx (awaited once, right after a new account is added, so
// the "account added" toast can show a real name instead of the raw identifier). Persists the
// result into accountSummaryStore itself, so any caller checking the store afterward sees it too.
export function resolveAccountSummary(key: AccountKey, account: SignedInAccount) {
  const existing = inFlight.get(key)
  if (existing) return existing

  const promise = (async () => {
    const steamId =
      account.mode === 'local'
        ? account.steamId
        : await invoke<string>('resolve_account_steam_id', { account })
    const response = await invoke<SteamPlayerSummaryResponse>('get_user_summary', { steamId })
    const player = response.response?.players?.[0]
    if (!player) return null

    const summary: AccountSummary = {
      personaName: player.personaname,
      avatarUrl: player.avatar ? toFullResAvatar(player.avatar) : null,
      steamId,
    }
    useAccountSummaryStore.getState().setSummary(key, summary)
    return summary
  })().finally(() => {
    inFlight.delete(key)
  })

  inFlight.set(key, promise)
  return promise
}
