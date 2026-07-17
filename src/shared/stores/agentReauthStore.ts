import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

interface AgentReauthStore {
  // Agent-mode accounts currently force-logged-off because the same account signed in elsewhere
  // (another device/session, or the real Steam client) - see useAgentReauthWatcher, which sets
  // this from the daemon's `status_changed{result: "LoggedInElseWhere"}` event. The Rust host
  // already stopped this account's automation by the time this flips true (see
  // steam_agent::process::handle_session_superseded) - this store only drives the UI side
  // (account switcher badge, blocking a plain switch-to in favor of re-auth).
  entries: Record<AccountKey, true>
  flag: (key: AccountKey) => void
  clear: (key: AccountKey) => void
  needsReauth: (key: AccountKey) => boolean
}

export const useAgentReauthStore = create<AgentReauthStore>((set, get) => ({
  entries: {},
  flag: key => set(state => ({ entries: { ...state.entries, [key]: true } })),
  clear: key =>
    set(state => {
      if (!(key in state.entries)) return state
      const entries = { ...state.entries }
      delete entries[key]
      return { entries }
    }),
  needsReauth: key => Boolean(get().entries[key]),
}))
