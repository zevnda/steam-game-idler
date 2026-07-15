import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

export interface AccountSummary {
  personaName: string
  avatarUrl: string | null
  // Resolved SteamID64 - for a local-mode account this just mirrors `SignedInAccount.steamId`,
  // but for agent mode it's the only place this ever gets resolved (GeneralSettingsTab.tsx needs
  // it to show a Steam ID alongside the sign-in username).
  steamId: string
}

interface AccountSummaryStore {
  // Persona/avatar data per signed-in account, resolved by useAccountSummaries - see that hook's
  // doc comment for why agent-mode accounts need this at all (local mode already had it, but only
  // transiently, inside the local sign-in screen itself). A key with no entry here just means
  // "not resolved yet" - callers fall back to the account's raw identifier, same as
  // AccountOption.tsx already falls back to an initial letter when avatarUrl is null.
  summaries: Record<AccountKey, AccountSummary>
  setSummary: (key: AccountKey, summary: AccountSummary) => void
  clearSummary: (key: AccountKey) => void
}

export const useAccountSummaryStore = create<AccountSummaryStore>(set => ({
  summaries: {},
  setSummary: (key, summary) =>
    set(state => ({ summaries: { ...state.summaries, [key]: summary } })),
  clearSummary: key =>
    set(state => {
      const summaries = { ...state.summaries }
      delete summaries[key]
      return { summaries }
    }),
}))
