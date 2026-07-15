// Mirrors src-tauri/src/idling/mod.rs's `IdleTarget`/`IdleSetResult`/`IdleFailure` (serde
// `rename_all = "camelCase"`). One shared shape for both sign-in modes - see that module's doc
// comment for why `name` only matters to CLI mode.
export interface IdleTarget {
  appId: number
  name: string
}

export interface IdleFailure {
  appId: number
  error: string
}

export interface IdleSetResult {
  appIds: number[]
  failures: IdleFailure[]
}

// Mirrors src-tauri/src/idling/claims.rs's OWNER_* constants exactly - the Idling page groups
// currently-idling games into a section per owner (see groupIdlingGames.ts).
export type IdleOwner = 'manual' | 'auto_idle' | 'achievement_unlocker' | 'card_farming'
