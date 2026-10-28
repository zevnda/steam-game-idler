//! Owned-games retrieval, shared between both sign-in modes - one `get_owned_games` command that
//! branches on sign-in mode internally, not a pair of mode-specific commands with frontend-side
//! branching. CLI mode's ownership check (`local_steam::ownership::check_ownership`) has no playtime
//! of its own, so `web_api::fetch_owned_games`/`merge::merge` enrich it from the Steam Web API.
//! Agent mode's ownership check (`steam_agent::AgentManager::get_owned_apps`) comes back already
//! enriched with playtime (`Daemon/Bot/OwnershipManager.cs` does its own SteamKit2-side
//! enrichment), so it takes the `merge::from_agent` path instead and never touches the Web API -
//! see `RawOwnedGame`'s doc comment for why.
//!
//! Each entry also carries the account's achievement completion counts for that game (see
//! `achievement_progress` for how they're fetched and kept in sync mid-session) - counts only, the
//! full per-achievement data stays the `achievements` module's job.

pub mod achievement_progress;
pub(crate) mod cache;
pub mod commands;
mod merge;
pub(crate) mod web_api;

use serde::{Deserialize, Serialize};

/// The shape both backends' ownership checks produce before Web API enrichment - mirrors
/// `libs/SteamUtility/Core/Models/OwnedGame.cs` exactly, including its nullable `name` (neither
/// backend has a reliable name-resolution path of its own - see that model's doc comment).
///
/// `playtime_forever_minutes`/`rtime_last_played` are always `None` for the CLI-mode backend
/// (`local_steam::ownership::check_ownership`, no playtime source of its own) and always `Some`
/// for the agent-mode backend (`steam_agent::AgentManager::get_owned_apps`) - `OwnershipManager`
/// self-enriches via SteamKit2's own `Player.GetOwnedGames#1` over the authenticated CM session,
/// so agent mode never needs `web_api::fetch_owned_games`. See `commands::get_owned_games`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawOwnedGame {
    pub app_id: u32,
    pub name: Option<String>,
    #[serde(default)]
    pub playtime_forever_minutes: Option<u64>,
    #[serde(default)]
    pub rtime_last_played: Option<u64>,
    /// Unix seconds of the most recent license grant for this app that was an actual purchase
    /// (see `OwnershipManager.IsRefundEligiblePurchase`), or `None` if every license granting it
    /// was a gift/key redemption/family-share/other free grant. Always `None` for the CLI-mode
    /// backend, which has no license-grant-time API surface at all - `card_farming`'s refund-
    /// window check treats an absent value as "no refund risk to report" rather than an error.
    #[serde(default)]
    pub last_refund_eligible_purchase_unix_seconds: Option<i64>,
}

/// One merged, cached, frontend-facing game entry. `name` stays `Option` rather than falling back
/// to a placeholder string - if neither backend nor the Steam Web API could resolve one, that's
/// signal worth preserving, not papering over.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnedGame {
    pub app_id: u32,
    pub name: Option<String>,
    pub playtime_forever_minutes: u64,
    /// Unix timestamp of the game's last play session, or `0` if unknown (never fetched via the
    /// Web API, or Steam has no record) - see `web_api::WebApiGame::rtime_last_played`. Powers the
    /// "Recently Played" dashboard carousel (`GamesPage.tsx`). `#[serde(default)]` so a cache file
    /// written before this field existed still deserializes (falls back to `0`, same as "unknown")
    /// instead of erroring - same resilience `settings::Settings` applies to its own fields.
    #[serde(default)]
    pub rtime_last_played: u64,
    /// See `RawOwnedGame::last_refund_eligible_purchase_unix_seconds`. `#[serde(default)]` so a
    /// cache file written before this field existed still deserializes as `None` rather than
    /// erroring, same resilience `settings::Settings` applies to its own fields.
    #[serde(default)]
    pub last_refund_eligible_purchase_unix_seconds: Option<i64>,
    /// How many of this game's achievements the account has unlocked, and how many it has in
    /// total - `None` for both when unknown (never fetched yet, the fetch failed, or a CLI-mode
    /// account's private profile hid it), which is deliberately distinct from `Some(0)` total (a
    /// game with no achievements at all). See `achievement_progress`. `#[serde(default)]` so a
    /// cache file written before these fields existed still deserializes as unknown.
    #[serde(default)]
    pub achievements_unlocked: Option<u32>,
    #[serde(default)]
    pub achievements_total: Option<u32>,
}

/// One game's achievement completion counts - the wire shape of both the daemon's
/// `achievements_progress` response (`Daemon/Bot/AchievementProgressManager.cs`'s
/// `AchievementProgressDto`) and the `ACHIEVEMENT_PROGRESS_EVENT` payload's entries.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementProgress {
    pub app_id: u32,
    pub unlocked: u32,
    pub total: u32,
}

/// `commands::get_owned_games`'s return shape - carries `possibly_private` alongside the games
/// list itself since both come out of the same fetch, avoiding a second round-trip for the
/// frontend to learn whether playtime/off-whitelist data is likely incomplete.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnedGamesResult {
    pub games: Vec<OwnedGame>,
    /// `true` only for the CLI-mode backend, when the Steam Web API's `GetOwnedGames` response
    /// had no `game_count` field - Valve's documented signal that the request was blocked by the
    /// profile/game-details privacy settings of the account behind `steamid` (see
    /// `web_api::GetOwnedGamesResponse`). Always `false` for agent mode, which never depends on
    /// the Web API for ownership completeness - see `RawOwnedGame`'s doc comment.
    pub possibly_private: bool,
}
