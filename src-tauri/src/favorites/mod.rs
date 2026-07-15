//! Per-account favorited-games bookmarking, independent of games-list/idling - a favorite is a
//! user's own pure organizational marker; nothing else in the app reads or derives behavior from
//! it. Deliberately its own vertical feature (own cache file, own commands) rather than a shared
//! module across the four "custom list" concepts (favorites/card-farming queue/achievement-unlocker
//! queue/auto-idle queue) - a shared abstraction there tends to end up as a stringly-typed module
//! plus a single giant component branching on list type throughout, exactly the god-module/
//! component shape this codebase avoids. If a later list-type feature turns out to need genuinely
//! identical logic, extract a shared helper then.

mod cache;
pub mod commands;

use serde::{Deserialize, Serialize};

/// One favorited game as persisted to disk. `name` is stored alongside `app_id` for the same
/// reason `idling::IdleTarget` does - it lets the favorites page render an entry before
/// games-list's own fetch has resolved, and survives a game transiently missing from the current
/// owned-games response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteEntry {
    pub app_id: u32,
    pub name: String,
}
