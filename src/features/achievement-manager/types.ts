// Mirrors src-tauri/src/achievements/mod.rs (serde `rename_all = "camelCase"`, with per-field
// overrides on the wire-quirky fields - see that file's doc comments for exactly which fields and
// why). `percent` is backend-agnostic in practice - CLI mode gets it natively, agent mode gets it
// backfilled from a public Web API (see AchievementDto's doc comment) - but it's still omitted
// entirely from the wire rather than `0` on a lookup miss/failure, so this stays optional here too.
export interface AchievementDto {
  id: string
  name: string
  description: string
  iconNormal: string
  iconLocked: string
  permission: number
  hidden: boolean
  achieved: boolean
  percent?: number
  protectedAchievement: boolean
  flags: string
}

// `value` is a raw JSON number on the wire (int or float depending on `statType`) - typed as
// `number` here since every real stat value observed live-testing this backend (Step 14) has been
// numeric, matching how every other frontend type in this rewrite mirrors its Rust counterpart
// pragmatically rather than modeling the full union.
export interface StatDto {
  id: string
  name: string
  statType: string
  permission: number
  value: number
  incrementOnly: boolean
  protectedStat: boolean
  flags: string
}

export interface AchievementData {
  achievements: AchievementDto[]
  stats: StatDto[]
}

// `name` must be a `StatDto.id`, not its display `name` - see StatUpdate's doc comment in
// src-tauri/src/achievements/mod.rs for the full explanation (confirmed live: the display name
// fails with `stat_not_found`).
export interface StatUpdate {
  name: string
  value: number
}

export interface BulkAchievementResult {
  succeeded: string[]
  skipped: string[]
  failed: string[]
}
