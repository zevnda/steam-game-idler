//! Achievement/stat data and actions for one game, shared between both sign-in modes. One command
//! surface (`commands::*`) branches internally on `GamesAccount`, not a pair of mode-specific
//! commands. Backs the single-game achievement-manager overlay and the achievement-unlocker
//! automation feature, which needs the same primitives plus its own queue/timing logic.

pub mod commands;
pub mod web_api;

use serde::{Deserialize, Serialize};

/// Mirrors `libs/SteamUtility/Core/Models/AchievementDto.cs` field-for-field, including its wire
/// naming exactly - most fields are camelCase, but `protected_achievement` is
/// `[JsonPropertyName("protected_achievement")]` in the C# source, deliberately **not** camelCased
/// like its neighbors, so it needs an explicit override rather than the container-level
/// `rename_all`.
///
/// This struct does double duty - `Deserialize` for SteamUtility's snake_case wire, `Serialize`
/// for the outgoing Tauri IPC payload to the frontend, which expects camelCase like every other
/// DTO. A single `rename` applies to both directions, so `protected_achievement` was round-
/// tripping to the frontend as snake_case too, silently leaving `AchievementDto.protectedAchievement`
/// `undefined` in TS (found live: the achievement-manager's protected-items `<Alert>`, lock icon,
/// and sort never triggered). Fixed with direction-specific `rename(serialize|deserialize)`.
///
/// `percent` (global unlock rarity) is only ever populated directly by the CLI/local-client backend
/// (`GetAchievementAchievedPercent` has no SteamKit2 wire-protocol equivalent) - SteamUtility omits
/// it from the wire entirely when absent, not faked as `0`, matching the C# side's own
/// `JsonIgnore(WhenWritingNull)`. `commands::get_achievement_data` backfills it for whichever
/// achievements come back without one (always agent mode, since it's a public, session-independent
/// Web API lookup - see `web_api::fetch_global_percentages`), so this stays optional here rather
/// than a hard mode-based guarantee.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementDto {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon_normal: String,
    pub icon_locked: String,
    pub permission: i32,
    pub hidden: bool,
    pub achieved: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub percent: Option<f32>,
    #[serde(rename(
        deserialize = "protected_achievement",
        serialize = "protectedAchievement"
    ))]
    pub protected_achievement: bool,
    pub flags: String,
}

/// Mirrors `libs/SteamUtility/Core/Models/StatDto.cs`. Unlike `AchievementDto`, most of this DTO's
/// multi-word fields are deliberately `snake_case` on the wire (`stat_type`, `increment_only`,
/// `protected_stat` - see that file's `[JsonPropertyName]` attributes), so each needs an explicit
/// override against the container-level `rename_all = "camelCase"` rather than falling through to
/// it - only `id`/`name`/`permission`/`value`/`flags` are actually case-invariant single words.
/// `value` stays a raw JSON value since it's either an integer or a float depending on `stat_type`,
/// matching the C# side's `object? Value`. As with `AchievementDto.protected_achievement`, each
/// override is direction-specific (`deserialize` matches SteamUtility's snake_case, `serialize`
/// matches the camelCase every frontend DTO expects) - a single `rename` would round-trip these
/// snake_case straight through to the frontend and leave `StatDto.statType`/`incrementOnly`/
/// `protectedStat` `undefined` in TS.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatDto {
    pub id: String,
    pub name: String,
    #[serde(rename(deserialize = "stat_type", serialize = "statType"))]
    pub stat_type: String,
    pub permission: i32,
    pub value: serde_json::Value,
    #[serde(rename(deserialize = "increment_only", serialize = "incrementOnly"))]
    pub increment_only: bool,
    #[serde(rename(deserialize = "protected_stat", serialize = "protectedStat"))]
    pub protected_stat: bool,
    pub flags: String,
}

/// One achievement/stats snapshot for a game, as returned by `get_achievement_data`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementData {
    pub achievements: Vec<AchievementDto>,
    pub stats: Vec<StatDto>,
}

/// A single stat write, matching `libs/SteamUtility/Core/Models/StatUpdateRequest.cs`'s wire shape
/// (`{name, value}`) used by both the CLI's `update_stats` JSON arg and the daemon's `stats_update`
/// IPC command.
///
/// **`name` must be a `StatDto.id`, not a `StatDto.name`** - despite the field being called `Name`
/// on both the C# and Rust sides, both backends match it against the stat's internal schema `Id`
/// (`SteamworksLocalBackend.UpdateStatsAsync`: `statDefs.FirstOrDefault(d => d.Id == update.Name)`;
/// `AchievementHandler.UpdateStatsAsync` does the identical lookup for the daemon path), not its
/// human-readable display name. Confirmed live: passing a real `StatDto.name` (e.g. "Enemies
/// killed") failed with `stat_not_found`; passing the same stat's `id` (`stat_enemies_killed`)
/// succeeded. The future achievement-manager frontend must build this request from `StatDto.id`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatUpdate {
    pub name: String,
    pub value: f64,
}

/// Outcome of `unlock_all_achievements`/`lock_all_achievements`, for either backend. CLI mode gets
/// this straight from `Core/Services/BulkAchievementSetter.cs` (composed C#-side, one process);
/// agent mode composes the identical semantics Rust-side instead, since the daemon has no bulk IPC
/// verb - see `steam_agent::AgentManager::bulk_set_achievements`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkAchievementResult {
    pub succeeded: Vec<String>,
    pub skipped: Vec<String>,
    pub failed: Vec<String>,
}
