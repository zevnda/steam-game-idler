//! Per-account "idle these games automatically" queue - started once on app launch (the
//! frontend's `useAutoIdleStartup`, mounted in `DashboardShell`) and via a manual "Start Now"
//! button, and chained into from achievement-unlocker's `next_task: "autoIdle"` setting
//! (`achievement_unlocker::manager::maybe_start_next_task`). Deliberately its own vertical
//! feature (own cache file, own commands), not a shared "custom list" module across
//! favorites/card-farming-queue/achievement-unlocker-queue/auto-idle-queue - same reasoning
//! `favorites`'s module doc comment already documents.
//!
//! **One difference from a naive port**: each entry carries its own `enabled` flag rather than
//! splitting that into two sources of truth - a Rust-persisted list plus a separate client-only
//! `autoIdleDisabled_<steamId>` localStorage set, which can drift (a fresh install/different
//! machine loses the localStorage half but keeps the list). Putting `enabled` on the entry itself
//! keeps one authoritative file.

mod cache;
pub mod commands;

use serde::{Deserialize, Serialize};

/// One auto-idle queue entry as persisted to disk. `name` is stored alongside `app_id` for the
/// same reason `favorites::FavoriteEntry`/`idling::IdleTarget` do - it lets the page render before
/// games-list's own fetch has resolved, and survives a game transiently missing from the current
/// owned-games response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoIdleEntry {
    pub app_id: u32,
    pub name: String,
    pub enabled: bool,
}
