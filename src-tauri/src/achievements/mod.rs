//! Achievement/stat data and actions for one game, shared between both sign-in modes. One command
//! surface (`commands::*`) branches internally on `GamesAccount`, not a pair of mode-specific
//! commands. Backs the single-game achievement-manager overlay and the achievement-unlocker
//! automation feature, which needs the same primitives plus its own queue/timing logic.

pub mod commands;
pub mod library_run;
pub mod steam_language;
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
    /// The `AchievementGroupDto.id` this achievement belongs to - `None` for the implicit
    /// base-game set and for every game without Achievement Sets (SteamUtility omits it then).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group_id: Option<i32>,
}

/// Mirrors `libs/SteamUtility/Core/Models/AchievementGroupDto.cs` - one Steam "Achievement Set"
/// parsed from the game's stats schema (see that file's doc comment). `dlc_app_id` is `Some` for a
/// DLC set, and `owned` whether this account owns that DLC - `None` for a non-DLC set *or* when
/// SteamUtility's ownership lookup failed, which is treated as owned (fail open).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementGroupDto {
    pub id: i32,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dlc_app_id: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub owned: Option<bool>,
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
    /// Empty for a game without Achievement Sets.
    #[serde(default)]
    pub groups: Vec<AchievementGroupDto>,
}

impl AchievementData {
    /// Ids of the DLC sets this account is known not to own. Steam rejects a `StoreStats` write
    /// that unlocks one of their achievements (`EResult.InvalidParam`, seen live on ETS2) - and for
    /// a batched write, the *whole* batch - so every unlock path skips them. Same rule as the C#
    /// side's `AchievementGroupDto.UnownedDlcGroupIds` (CLI mode's bulk unlock).
    pub fn unowned_dlc_group_ids(&self) -> std::collections::HashSet<i32> {
        self.groups
            .iter()
            .filter(|group| group.dlc_app_id.is_some() && group.owned == Some(false))
            .map(|group| group.id)
            .collect()
    }
}

impl AchievementDto {
    pub fn is_in_group(&self, group_ids: &std::collections::HashSet<i32>) -> bool {
        self.group_id.is_some_and(|id| group_ids.contains(&id))
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    const ACHIEVEMENT_JSON: &str = r#"{"id":"a","name":"A","description":"","iconNormal":"","iconLocked":"","permission":0,"hidden":false,"achieved":false,"protected_achievement":false,"flags":"None""#;

    // SteamUtility's real `achievements_get`/`get_achievement_data` wire shape for a game with
    // Achievement Sets (field names taken from a live ETS2 run) - guards the camelCase mapping of
    // the new fields in both directions, the way protected_achievement once silently broke.
    #[test]
    fn deserializes_achievement_sets_and_reserializes_camel_case() {
        let wire = format!(
            r#"{{"achievements":[{ACHIEVEMENT_JSON},"groupId":6}}],"stats":[],"groups":[{{"id":6,"name":"Scandinavia","dlcAppId":304212}},{{"id":12,"name":"Driving Academy"}}]}}"#
        );
        let data: AchievementData = serde_json::from_str(&wire).unwrap();
        assert_eq!(data.achievements[0].group_id, Some(6));
        assert_eq!(data.groups[0].dlc_app_id, Some(304212));
        assert_eq!(data.groups[1].dlc_app_id, None);

        let out = serde_json::to_value(&data).unwrap();
        assert_eq!(out["achievements"][0]["groupId"], 6);
        assert_eq!(out["groups"][0]["dlcAppId"], 304212);
        assert!(out["groups"][1].get("dlcAppId").is_none());
    }

    // Only a DLC set explicitly reported unowned is excluded - an owned DLC set, a non-DLC set, and
    // a DLC set whose ownership lookup failed (`owned` omitted) all stay unlockable (fail open).
    #[test]
    fn unowned_dlc_group_ids_only_counts_known_unowned_dlc() {
        let wire = format!(
            r#"{{"achievements":[{ACHIEVEMENT_JSON},"groupId":6}}],"stats":[],"groups":[{{"id":6,"name":"Scandinavia","dlcAppId":304212,"owned":false}},{{"id":7,"name":"Baltic","dlcAppId":925580,"owned":true}},{{"id":8,"name":"Iberia","dlcAppId":1209460}},{{"id":12,"name":"Driving Academy"}}]}}"#
        );
        let data: AchievementData = serde_json::from_str(&wire).unwrap();
        let unowned = data.unowned_dlc_group_ids();
        assert_eq!(unowned, std::collections::HashSet::from([6]));
        assert!(data.achievements[0].is_in_group(&unowned));
    }

    // A game without sets: SteamUtility omits `groupId`, and `groups` is defaulted if absent.
    #[test]
    fn missing_group_fields_default_to_base_game() {
        let wire = format!(r#"{{"achievements":[{ACHIEVEMENT_JSON}}}],"stats":[]}}"#);
        let data: AchievementData = serde_json::from_str(&wire).unwrap();
        assert_eq!(data.achievements[0].group_id, None);
        assert!(data.groups.is_empty());
        assert!(serde_json::to_value(&data).unwrap()["achievements"][0].get("groupId").is_none());
    }
}
