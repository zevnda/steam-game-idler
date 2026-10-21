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
  // `AchievementGroup.id` - absent for the implicit base-game set and for every game without
  // Achievement Sets.
  groupId?: number
  // Archived by the developer, individually or via its whole set - absent when not. Steam won't
  // unlock one the account hasn't already earned (see isUnlockBlocked in utils/groupAchievements.ts).
  archived?: boolean
}

// One Steam "Achievement Set" - mirrors AchievementGroupDto in src-tauri/src/achievements/mod.rs.
// `dlcAppId` is set for a DLC set, and `owned` says whether this account owns that DLC - absent
// for a non-DLC set *or* when the ownership lookup failed, which is treated as owned (fail open,
// see isUnownedDlcGroup in utils/groupAchievements.ts).
export interface AchievementGroup {
  id: number
  name: string
  dlcAppId?: number
  owned?: boolean
  // The whole set is archived - display-only, since each member achievement carries `archived` too.
  archived?: boolean
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

// Which pane the overlay's main area shows, picked from AchievementManagerSidebar.tsx's nav:
// achievements (all of them when `setKey` is null, otherwise one Achievement Set's section key -
// see utils/groupAchievements.ts) or the statistics editor.
export type AchievementManagerView =
  { kind: 'achievements'; setKey: number | null } | { kind: 'statistics' }

export interface AchievementData {
  achievements: AchievementDto[]
  stats: StatDto[]
  groups: AchievementGroup[]
}

// `name` must be a `StatDto.id`, not its display `name` - see StatUpdate's doc comment in
// src-tauri/src/achievements/mod.rs for the full explanation (confirmed live: the display name
// fails with `stat_not_found`).
export interface StatUpdate {
  name: string
  value: number
}

// Mirrors `achievements::SetAchievementsResult` - the staged "Save changes" outcome.
export interface SetAchievementsResult {
  succeeded: string[]
  failed: string[]
}

export interface BulkAchievementResult {
  succeeded: string[]
  skipped: string[]
  failed: string[]
}
