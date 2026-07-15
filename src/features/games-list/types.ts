// Mirrors `OwnedGame` in src-tauri/src/games/mod.rs (serde `rename_all = "camelCase"`). `name` stays
// nullable - neither backend always resolves one (see that struct's doc comment), so the UI must
// fall back gracefully rather than assume it's always present.
export interface OwnedGame {
  appId: number
  name: string | null
  playtimeForeverMinutes: number
  rtimeLastPlayed: number
}
