// Mirrors src-tauri/src/achievement_unlocker/mod.rs (serde `rename_all = "camelCase"`).
export interface AchievementUnlockerEntry {
  appId: number
  name: string
}

// Mirrors src-tauri/src/achievement_unlocker/settings.rs::ScheduleTime - deliberately just
// hour/minute (not a full time-library value), matching that struct's own doc comment.
export interface ScheduleTime {
  hour: number
  minute: number
}

// Mirrors src-tauri/src/achievement_unlocker/settings.rs::AchievementUnlockerSettings.
export interface AchievementUnlockerSettings {
  hidden: boolean
  idle: boolean
  multipleGames: boolean
  interval: [number, number]
  schedule: boolean
  scheduleFrom: ScheduleTime
  scheduleTo: ScheduleTime
  nextTaskCheckbox: boolean
  nextTask: string | null
}

// Mirrors src-tauri/src/achievement_unlocker/order.rs::AchievementOrderEntry. `id` matches
// AchievementDto::id (achievement-manager's types.ts), not the display name - see that Rust
// struct's doc comment for why.
export interface AchievementOrderEntry {
  id: string
  skip: boolean
  delayNextUnlock?: number
}

// Mirrors src-tauri/src/achievement_unlocker/order.rs::AchievementOrder.
export interface AchievementOrder {
  achievements: AchievementOrderEntry[]
  delayBeforeFirstUnlock?: number
}

// Mirrors src-tauri/src/achievement_unlocker/import_timings.rs::AchievementTiming.
export interface AchievementTiming {
  id: string
  unlockTime: number
}

// Gamer-tier concurrency cap - mirrors src-tauri/src/achievement_unlocker/manager.rs::MAX_CONCURRENT_GAMES.
export const MAX_CONCURRENT_GAMES = 32

// Casual-tier concurrency cap (2026-07-15) - a modest automation stepping stone between Free's
// forced single-game default and Gamer's full MAX_CONCURRENT_GAMES, so `multipleGames` isn't an
// all-or-nothing gamer-only gate. See utils/resolveMaxConcurrentGames.ts and PRO_TIER.md.
export const CASUAL_MAX_CONCURRENT_GAMES = 3

// Mirrors src-tauri/src/achievement_unlocker/mod.rs::UpcomingAchievement. `unlockAtMs` is an
// absolute timestamp, not a ticking countdown - the frontend derives its own relative "in Xm"
// display from render time instead of the backend re-emitting a value every second.
export interface UpcomingAchievement {
  id: string
  name: string
  iconLocked: string
  percent?: number
  unlockAtMs: number
}

// Mirrors src-tauri/src/achievement_unlocker/mod.rs::ActiveGameProgress.
export interface ActiveGameProgress {
  appId: number
  name: string
  isInitialDelay: boolean
  initialDelayEndsAtMs?: number
  isWaitingForSchedule: boolean
  achievementCount: number
  upcoming: UpcomingAchievement[]
}

// Mirrors src-tauri/src/achievement_unlocker/mod.rs::ScanProgress.
export interface AchievementUnlockerScanProgress {
  checked: number
  total: number
}

// Mirrors src-tauri/src/achievement_unlocker/mod.rs::CompletedUnlockReason.
export type CompletedUnlockReason =
  'finished' | 'maxUnlocksReached' | 'maxPlaytime' | 'nothingToUnlock'

// Mirrors src-tauri/src/achievement_unlocker/mod.rs::CompletedUnlock.
export interface CompletedUnlock {
  appId: number
  name: string
  unlocked: number
  total: number
  reason: CompletedUnlockReason
}

// Mirrors src-tauri/src/achievement_unlocker/mod.rs::AchievementUnlockerState.
export interface AchievementUnlockerState {
  isRunning: boolean
  scanProgress: AchievementUnlockerScanProgress | null
  active: ActiveGameProgress[]
  completed: CompletedUnlock[]
}

export const DEFAULT_ACHIEVEMENT_UNLOCKER_STATE: AchievementUnlockerState = {
  isRunning: false,
  scanProgress: null,
  active: [],
  completed: [],
}
