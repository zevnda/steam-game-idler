//! Import-timings: given an arbitrary Steam profile (steamid64, profile URL, or vanity URL) and a
//! game, fetch that player's real achievement unlock timestamps so the order-editor frontend can
//! derive realistic per-achievement delays from someone else's actual playthrough pacing.
//! Gamer-tier gated on the frontend.
//!
//! Not account-scoped and doesn't branch on `GamesAccount` - this queries a target profile that has
//! nothing to do with which account is signed in to this app. The Steam Web API key is resolved
//! internally via `steam_web_api::resolve_api_key`, the same pattern
//! `games::commands::get_owned_games` uses.

use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};
use crate::steam_web_api::resolve_api_key;

/// One achievement's real unlock timestamp from a target player's profile. `id` matches
/// `AchievementDto::id`/`AchievementOrderEntry::id` (Steam's schema `apiname`) - the frontend
/// derives per-achievement delays from consecutive `unlock_time`s itself, same math `main`'s
/// `ImportTimingsModal.tsx` already does, kept out of this backend command since it's presentation
/// logic, not data fetching.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementTiming {
    pub id: String,
    pub unlock_time: u64,
}

#[derive(Debug, Deserialize)]
struct ResolveVanityResponse {
    response: ResolveVanityInner,
}

#[derive(Debug, Deserialize)]
struct ResolveVanityInner {
    success: i32,
    #[serde(default)]
    steamid: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GetPlayerAchievementsResponse {
    playerstats: PlayerStats,
}

#[derive(Debug, Deserialize)]
struct PlayerStats {
    #[serde(default)]
    success: Option<bool>,
    #[serde(default)]
    achievements: Vec<RawAchievement>,
}

#[derive(Debug, Deserialize)]
struct RawAchievement {
    apiname: String,
    #[serde(default)]
    achieved: u32,
    #[serde(default)]
    unlocktime: u64,
}

/// Resolves `steam_input` to a SteamID64: a literal 17-digit id, a `/profiles/<id>` URL, a
/// `/id/<vanity>` URL, or a bare vanity name (resolved via `ResolveVanityURL`) - mirrors `main`'s
/// exact parsing precedence.
async fn resolve_steam_id64(
    client: &Client,
    api_key: &str,
    steam_input: &str,
) -> AppResult<String> {
    let trimmed = steam_input.trim();

    if trimmed.len() == 17 && trimmed.chars().all(|c| c.is_ascii_digit()) {
        return Ok(trimmed.to_string());
    }

    if let Some(idx) = trimmed.find("/profiles/") {
        let rest = &trimmed[idx + "/profiles/".len()..];
        let id = rest.trim_end_matches('/').split('/').next().unwrap_or("");
        if !id.is_empty() {
            return Ok(id.to_string());
        }
    }

    let vanity = if let Some(idx) = trimmed.find("/id/") {
        let rest = &trimmed[idx + "/id/".len()..];
        rest.trim_end_matches('/').split('/').next().unwrap_or("")
    } else {
        trimmed
    };

    let url = format!(
        "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key={api_key}&vanityurl={vanity}"
    );
    let body: ResolveVanityResponse = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    match body.response.steamid {
        Some(steam_id) if body.response.success == 1 => Ok(steam_id),
        _ => Err(AppError::PlayerProfileNotFound(steam_input.to_string())),
    }
}

/// Fetches `steam_input`'s real achievement unlock timestamps for `app_id`, filtered to achieved
/// achievements with a nonzero timestamp and sorted ascending - identical filtering to `main`.
pub async fn get_player_achievement_timings(
    app_id: u32,
    steam_input: String,
    api_key: Option<String>,
) -> AppResult<Vec<AchievementTiming>> {
    let key = resolve_api_key(api_key)?;
    let client = Client::new();

    let steam_id = resolve_steam_id64(&client, &key, &steam_input).await?;

    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid={app_id}&key={key}&steamid={steam_id}"
    );
    let body: GetPlayerAchievementsResponse = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    if body.playerstats.success != Some(true) {
        return Err(AppError::PlayerProfilePrivate);
    }

    let mut unlocked: Vec<AchievementTiming> = body
        .playerstats
        .achievements
        .into_iter()
        .filter(|a| a.achieved == 1 && a.unlocktime > 0)
        .map(|a| AchievementTiming {
            id: a.apiname,
            unlock_time: a.unlocktime,
        })
        .collect();

    if unlocked.is_empty() {
        return Err(AppError::PlayerNoTimestamps);
    }

    unlocked.sort_by_key(|a| a.unlock_time);
    Ok(unlocked)
}
