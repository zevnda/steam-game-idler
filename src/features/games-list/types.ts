// Mirrors `OwnedGame` in src-tauri/src/games/mod.rs (serde `rename_all = "camelCase"`). `name` stays
// nullable - neither backend always resolves one (see that struct's doc comment), so the UI must
// fall back gracefully rather than assume it's always present.
export interface OwnedGame {
  appId: number
  name: string | null
  playtimeForeverMinutes: number
  rtimeLastPlayed: number
  // Both `null` while unknown (not fetched yet, or a CLI-mode private profile) - distinct from a
  // `0` total, which means the game has no achievements at all. Filled in and kept current by
  // `games::achievement_progress` (Rust) + `useAchievementProgressSync`.
  achievementsUnlocked: number | null
  achievementsTotal: number | null
}
