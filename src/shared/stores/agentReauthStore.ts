import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

// Why an account's session ended, which decides what can bring it back:
// - `replaced`: another client of the same kind (usually a second SGI instance) took over. The saved
//   token still works, so reconnecting with it takes the session back.
// - `sessionEnded`: Steam refused to let the session reconnect (e.g. a password change revoked the
//   saved token). Replaying that token can never work, so only a fresh sign-in helps.
export type AgentReauthReason = 'replaced' | 'sessionEnded'

interface AgentReauthStore {
  // Agent-mode accounts whose session has ended for good - see useAgentReauthWatcher, which sets
  // this from the daemon's events. Not set when the user merely plays a game on their real Steam
  // client - that only pauses automation (playingSessionStore). The Rust host already stopped this
  // account's automation by the time this flips true (see steam_agent::process::handle_session_lost)
  // - this store only drives the UI side (account switcher badge, blocking a plain switch-to in favor
  // of re-auth).
  entries: Record<AccountKey, AgentReauthReason>
  flag: (key: AccountKey, reason: AgentReauthReason) => void
  clear: (key: AccountKey) => void
  needsReauth: (key: AccountKey) => boolean
}

export const useAgentReauthStore = create<AgentReauthStore>((set, get) => ({
  entries: {},
  flag: (key, reason) => set(state => ({ entries: { ...state.entries, [key]: reason } })),
  clear: key =>
    set(state => {
      if (!(key in state.entries)) return state
      const entries = { ...state.entries }
      delete entries[key]
      return { entries }
    }),
  needsReauth: key => Boolean(get().entries[key]),
}))
