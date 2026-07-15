// Mirrors src-tauri/src/free_games/mod.rs's `FreeGameEntry`/`FreeGameClaimOutcome` (serde
// `rename_all = "camelCase"` / `rename_all_fields = "camelCase"`, `tag = "outcome"`).
export interface FreeGameEntry {
  appId: number
  name: string
}

export type FreeGameClaimOutcome =
  { outcome: 'granted' } | { outcome: 'alreadyOwned' } | { outcome: 'failed'; reason: string }

// Mirrors src-tauri/src/free_games/settings.rs's `FreeGamesSettings`.
export interface FreeGamesSettings {
  autoRedeem: boolean
}
