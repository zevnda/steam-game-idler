//! Per-account achievement-unlocker queue (`cache`/`commands` - which games are lined up for
//! automatic achievement unlocking, add/remove/reorder), settings (`settings` - unlock pacing/
//! scheduling/toggles plus per-game max-unlocks overrides), per-game achievement ordering
//! (`order` - custom order/skip/per-achievement delay, one file per game), the import-timings
//! lookup (`import_timings` - deriving delays from a real player's unlock history), and the actual
//! unlock automation loop (`manager` - combines all three of the above into a running background
//! task: idle up to [`manager::MAX_CONCURRENT_GAMES`] queued games concurrently, unlock their
//! achievements one at a time with real pacing/scheduling, backfilling from the queue as games
//! finish, until the queue empties).
//!
//! Its own vertical module (own cache files, own commands) rather than a shared "custom lists"
//! abstraction spanning favorites/card-farming-queue/achievement-unlocker-queue/auto-idle-queue via
//! a stringly-typed `list` param - that shared shape is exactly the god-module/component pattern
//! this codebase avoids. `cache`/`settings` mirror `favorites`' shape file-for-file since the
//! underlying problem (a per-account ordered list of app ids) is identical; `order` departs from
//! that shape deliberately since it's genuinely per-game, not per-account.

mod cache;
pub mod commands;
pub mod import_timings;
pub mod manager;
pub mod order;
pub mod settings;

use serde::{Deserialize, Serialize};

pub use manager::AchievementUnlockerManager;

/// One queued game as persisted to disk. `name` is stored alongside `app_id` for the same reason
/// `FavoriteEntry`/`idling::IdleTarget` do - it lets the queue page render an entry before
/// games-list's own fetch has resolved, and survives a game transiently missing from the current
/// owned-games response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementUnlockerEntry {
    pub app_id: u32,
    pub name: String,
}

/// Emitted whenever a running unlocker session's tracked state changes - mirrors
/// `card_farming::FARMING_STATE_EVENT`'s "one event, no per-mode variant" shape. Payload is
/// `{"steamId": "...", "state": AchievementUnlockerState}`.
pub const ACHIEVEMENT_UNLOCKER_STATE_EVENT: &str = "achievement-unlocker-state-changed";

/// One upcoming achievement projected in [`ActiveGameProgress::upcoming`] - an absolute
/// `unlock_at_ms` timestamp rather than a ticking countdown, so the frontend derives its own
/// relative "in Xm" display purely from render time instead of the backend re-emitting a value
/// every second.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpcomingAchievement {
    pub id: String,
    pub name: String,
    pub icon_locked: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub percent: Option<f32>,
    pub unlock_at_ms: i64,
}

/// One game currently being processed by a running unlocker session.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveGameProgress {
    pub app_id: u32,
    pub name: String,
    /// The fixed ~10s grace period before a worker starts its first game for the session - matches
    /// `main`'s hardcoded initial delay. `initial_delay_ends_at_ms` is `Some` only while this is
    /// `true`, same absolute-timestamp-not-ticking-countdown reasoning as [`UpcomingAchievement`].
    pub is_initial_delay: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_delay_ends_at_ms: Option<i64>,
    pub is_waiting_for_schedule: bool,
    /// Achievements still to unlock this session, counting down from either the per-game
    /// max-unlocks override or the total remaining-achievements count, whichever is smaller -
    /// mirrors `main`'s `achievementCount` display field.
    pub achievement_count: u32,
    pub upcoming: Vec<UpcomingAchievement>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub checked: u32,
    pub total: u32,
}

/// Why a game left the run without the frontend ever seeing it in `active` for long (or at all) -
/// surfaced on [`CompletedUnlock`] so the "session finished" summary can explain a fast-ending
/// session instead of it just looking like nothing happened. A single game hitting
/// [`CompletedUnlockReason::MaxPlaytime`] or [`CompletedUnlockReason::NothingToUnlock`] on the very
/// first scan pass (the most common way a session ends in well under a second) is exactly the case
/// that used to leave no visible trace at all.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CompletedUnlockReason {
    /// Genuinely ran out of achievements to unlock - `remaining` hit zero.
    Finished,
    /// Hit its per-game max-unlocks override with achievements still remaining - a deliberate cap,
    /// not the game actually running out.
    MaxUnlocksReached,
    /// Hit its max-playtime cap - either detected before a single achievement was attempted (the
    /// scan phase's own check) or partway through unlocking (the mid-run check in `unlock_game`).
    MaxPlaytime,
    /// Scanned but had nothing eligible to unlock - already fully achieved, every remaining
    /// achievement is hidden with "skip hidden" on, the schema has a protected achievement (see
    /// `scan_game`'s doc comment), or the scan itself failed (settings/achievement-data read error,
    /// already logged separately as a `tracing::warn!` at the failure site).
    NothingToUnlock,
}

/// One game a running session fully finished with this pass, tagged with why - surfaced so the
/// frontend can render a persistent "session finished" summary instead of the game just silently
/// vanishing from `active` once `cache::remove` dequeues it. Mirrors `card_farming::GameWithDrops`'s
/// identical role in `FarmingState::completed`. Not populated for a user-initiated stop - matches
/// `card_farming::poll_active`'s same distinction (a manual stop isn't "this game is done").
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedUnlock {
    pub app_id: u32,
    pub name: String,
    pub unlocked: u32,
    pub total: u32,
    pub reason: CompletedUnlockReason,
}

/// A running (or idle/default) unlocker session's full state - what `get_achievement_unlocker_state`/
/// [`ACHIEVEMENT_UNLOCKER_STATE_EVENT`] return. Mirrors `card_farming::FarmingState`'s "not a
/// persisted list, just this session's own bookkeeping" contract - once a session ends (stopped or
/// the queue genuinely empties) it's dropped entirely, so a later `get_achievement_unlocker_state`
/// call reads back `AchievementUnlockerState::default()`. `completed` deliberately isn't cleared by
/// `run_loop`'s own end-of-session cleanup (mirrors `card_farming::run_cycle`'s identical choice) -
/// the final `ACHIEVEMENT_UNLOCKER_STATE_EVENT` still carries it, so the frontend store that already
/// received that event keeps showing it until the user dismisses it or starts a new run, even though
/// a later `get_achievement_unlocker_state` call (e.g. after a reload) reads back defaults.
#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AchievementUnlockerState {
    pub is_running: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scan_progress: Option<ScanProgress>,
    pub active: Vec<ActiveGameProgress>,
    pub completed: Vec<CompletedUnlock>,
}
