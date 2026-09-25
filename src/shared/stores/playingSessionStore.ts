import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

// Mirrors `steam_agent::PlayingSession` in src-tauri/src/steam_agent/process.rs (serde
// `rename_all = "camelCase"`).
export interface PlayingSession {
  blocked: boolean
  appId: number | null
  sinceMs: number | null
}

// One span during which an account was paused - `until: null` while still ongoing.
export interface PauseInterval {
  since: number
  until: number | null
}

// Plenty for any real session (one per time the user sat down to play), while keeping a
// long-running app from growing this without bound. Older spans only matter for a game that's been
// continuously idling since before them, and dropping one just makes that game's timer read a
// little high - never wrong enough to matter.
const MAX_PAUSE_INTERVALS = 50

interface PlayingSessionStore {
  // Agent-mode accounts whose automation is currently paused because another Steam session on the
  // same account (usually the user's real Steam client) is playing a game - see
  // usePlayingSessionWatcher, the only writer. Only blocked accounts are kept; an absent key means
  // "not paused". Display-only: the daemon and Rust host pause/resume the automation themselves
  // (see src-tauri/src/steam_agent/playing.rs), this only explains it to the user.
  entries: Record<AccountKey, PlayingSession>
  // Every pause span seen this app session per account, so elapsed-idle timers can subtract paused
  // time (see `pausedOverlapMs`) instead of each timer needing its own start-time rewrite -
  // a subtraction works identically for frontend-tracked idle start times and card farming's
  // backend-supplied `activeSince`, which a frontend-side rewrite couldn't reach.
  pauses: Record<AccountKey, PauseInterval[]>
  // `sinceMs` of the pause whose PlayingElsewhereModal the user already closed, per account - so
  // closing it keeps it closed for the rest of *that* pause, and the next pause opens it again.
  dismissed: Record<AccountKey, number>
  set: (key: AccountKey, session: PlayingSession) => void
  dismiss: (key: AccountKey) => void
}

export const usePlayingSessionStore = create<PlayingSessionStore>(set => ({
  entries: {},
  pauses: {},
  dismissed: {},
  set: (key, session) =>
    set(state => {
      const intervals = state.pauses[key] ?? []
      const last = intervals.at(-1)
      const isOpen = last !== undefined && last.until === null

      if (session.blocked) {
        const entry = { ...session, sinceMs: session.sinceMs ?? Date.now() }
        return {
          entries: { ...state.entries, [key]: entry },
          pauses: isOpen
            ? state.pauses
            : {
                ...state.pauses,
                [key]: [...intervals, { since: entry.sinceMs, until: null }].slice(
                  -MAX_PAUSE_INTERVALS,
                ),
              },
        }
      }

      if (!(key in state.entries) && !isOpen) return state
      const entries = { ...state.entries }
      delete entries[key]
      const dismissed = { ...state.dismissed }
      delete dismissed[key]
      return {
        entries,
        dismissed,
        pauses: isOpen
          ? { ...state.pauses, [key]: [...intervals.slice(0, -1), { ...last, until: Date.now() }] }
          : state.pauses,
      }
    }),
  dismiss: key =>
    set(state => {
      const entry = state.entries[key]
      if (!entry?.sinceMs) return state
      return { dismissed: { ...state.dismissed, [key]: entry.sinceMs } }
    }),
}))

// Total time within [startMs, nowMs] that `intervals` covers - subtracted from a game's raw
// elapsed-idle time so its timer freezes while the account is paused and carries on from the same
// value afterwards. A game that started idling mid-pause correctly accrues nothing until it ends.
export function pausedOverlapMs(intervals: PauseInterval[], startMs: number, nowMs: number) {
  let total = 0
  for (const { since, until } of intervals) {
    const overlap = Math.min(until ?? nowMs, nowMs) - Math.max(since, startMs)
    if (overlap > 0) total += overlap
  }
  return total
}
