//! Steam Web API `GetGlobalAchievementPercentagesForApp` lookup - global unlock rarity
//! percentages. Unlike the rest of achievement/stat data, this is not backend-bound: Valve serves
//! it as a public, unauthenticated endpoint keyed only by `appid`, independent of session or
//! sign-in mode - the real source behind the local Steam client's native
//! `GetAchievementAchievedPercent()` too. Backfills `AchievementDto::percent` for agent mode, which
//! has no SteamKit2 wire-protocol equivalent of that native call (see `commands::get_achievement_data`).

use std::collections::HashMap;

use reqwest::Client;
use serde::Deserialize;

use crate::error::{AppError, AppResult};

#[derive(Debug, Deserialize)]
struct GetGlobalAchievementPercentagesResponse {
    achievementpercentages: AchievementPercentagesInner,
}

#[derive(Debug, Deserialize, Default)]
struct AchievementPercentagesInner {
    #[serde(default)]
    achievements: Vec<AchievementPercentage>,
}

#[derive(Debug, Deserialize)]
struct AchievementPercentage {
    name: String,
    // This endpoint serializes `percent` as a numeric-looking JSON *string* (`"80.9"`, not `80.9`)
    // - confirmed live against the real endpoint, unlike every other Steam Web API response this
    // codebase parses. A plain `f32` field silently fails deserialization for every response,
    // which - since the caller treats a failed lookup as best-effort and logs+continues rather
    // than erroring - looked indistinguishable from "this data doesn't exist for agent mode" until
    // checked against the raw HTTP response.
    #[serde(deserialize_with = "deserialize_percent")]
    percent: f32,
}

fn deserialize_percent<'de, D>(deserializer: D) -> Result<f32, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StringOrFloat {
        String(String),
        Float(f32),
    }

    match StringOrFloat::deserialize(deserializer)? {
        StringOrFloat::String(s) => s.parse().map_err(serde::de::Error::custom),
        StringOrFloat::Float(f) => Ok(f),
    }
}

/// Fetches every achievement's global unlock percentage for `app_id`, keyed by the internal API
/// name. That's exactly `AchievementDto::id` on both backends - `SchemaWalker.cs`'s
/// `AchievementDefinition.Id = bit["name"]` derives from the same schema `name` field this endpoint
/// reports under, so no separate id-mapping step is needed to join the two.
pub async fn fetch_global_percentages(app_id: u32) -> AppResult<HashMap<String, f32>> {
    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid={app_id}&format=json"
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?;

    let body: GetGlobalAchievementPercentagesResponse = response
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    Ok(body
        .achievementpercentages
        .achievements
        .into_iter()
        .map(|a| (a.name, a.percent))
        .collect())
}

#[derive(Debug, Deserialize, Default)]
struct GetSchemaForGameResponse {
    #[serde(default)]
    game: SchemaGame,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct SchemaGame {
    #[serde(default)]
    available_game_stats: Option<AvailableGameStats>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct AvailableGameStats {
    #[serde(default)]
    achievements: Vec<serde_json::Value>,
    #[serde(default)]
    stats: Vec<serde_json::Value>,
}

/// Checks `GetSchemaForGame` for whether `app_id` has *no* achievement/stat definitions at all -
/// the fast, plain-HTTP counterpart to the slow SteamKit2 `ClientGetUserStats` round trip. Steam's
/// CM servers take ~7-10s to answer that generic wire request for a schema-less title (confirmed
/// live against Once Human 2139460 and Banana Hellp 2068520) - apparently a slow negative lookup on
/// their end - while this dedicated schema endpoint answers quickly either way. Used by
/// `commands::get_achievement_data` to race the two for agent mode only (the only backend with this
/// slowness) and short-circuit to an empty result the moment this call confirms there's truly
/// nothing to fetch, rather than always waiting out the daemon.
///
/// Checks both `achievements` and `stats`, not achievements alone, so the short-circuit only fires
/// when it exactly matches what an empty `ClientGetUserStatsResponse` schema would have produced -
/// a stats-only title (achievements empty, stats non-empty) must not be short-circuited into a
/// falsely-empty stats list.
///
/// `Ok(false)` covers both "this title does have a schema" and "the request itself failed" -
/// either way the caller falls back to waiting on the authoritative daemon response instead of
/// guessing.
pub async fn confirm_empty_schema(app_id: u32) -> AppResult<bool> {
    let key = crate::steam_web_api::resolve_api_key(None)?;
    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={key}&appid={app_id}&format=json"
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?;

    let body: GetSchemaForGameResponse = response
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    Ok(schema_is_empty(&body))
}

fn schema_is_empty(body: &GetSchemaForGameResponse) -> bool {
    match &body.game.available_game_stats {
        Some(stats) => stats.achievements.is_empty() && stats.stats.is_empty(),
        None => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Regression coverage for a real bug: `SchemaGame` originally had no `rename_all =
    // "camelCase"`, so `available_game_stats` never matched the real `availableGameStats` JSON key
    // and silently deserialized to `None` (rescued by `#[serde(default)]`) - making every game,
    // not just schema-less ones, register as "empty" and lose achievements in the daemon race.
    // This sample is a trimmed real `GetSchemaForGame` response for Warframe (230410).
    #[test]
    fn a_real_response_with_achievements_and_stats_parses_as_non_empty() {
        let json = r#"{"game":{"gameName":"Warframe","gameVersion":"33","availableGameStats":{
            "stats":[{"name":"CIPHER_SOLVED","defaultvalue":0,"displayName":"Ciphers Solved"}],
            "achievements":[{"name":"ACHIEVEMENT_1","defaultvalue":0,"displayName":"We Shape Our Tools","hidden":0,"description":"desc"}]
        }}}"#;
        let body: GetSchemaForGameResponse = serde_json::from_str(json).unwrap();
        assert!(!schema_is_empty(&body));
    }

    #[test]
    fn a_schema_less_titles_response_parses_as_empty() {
        let json = r#"{"game":{"gameName":"Once Human","gameVersion":""}}"#;
        let body: GetSchemaForGameResponse = serde_json::from_str(json).unwrap();
        assert!(schema_is_empty(&body));
    }
}
