//! Steam Web API lookups (persona name/avatar) for local (CLI-mode) accounts, cached to
//! `user_summaries.json` so results stay available offline and repeated sign-ins don't re-hit the
//! API. Agent mode doesn't need this - SteamKit2 already carries persona/avatar data over the
//! signed-in session - but CLI mode's only account info before actually launching Steam is
//! `loginusers.vdf` (steam ID + persona name, no avatar). Ported from `main`'s `get_user_summary`.

use std::fs;

use reqwest::Client;
use serde_json::{json, Value};
use tauri::AppHandle;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;
use crate::steam_web_api::resolve_api_key;

const CACHE_FILE_NAME: &str = "user_summaries.json";

/// Fetches persona name/avatar for `steam_id` (a single ID or a comma-delimited list) and caches
/// each valid player individually, replacing any existing cache entry for that steam ID. Returns
/// the raw Steam Web API response body either way - callers that only need the cache should use
/// [`read_cache`] instead.
pub async fn get_user_summary(
    app_handle: &AppHandle,
    steam_id: &str,
    api_key: Option<String>,
) -> AppResult<Value> {
    let key = resolve_api_key(api_key)?;
    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={key}&steamids={steam_id}"
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?;

    let body: Value = response
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    let valid_players: Vec<&Value> = body
        .get("response")
        .and_then(|r| r.get("players"))
        .and_then(Value::as_array)
        .map(|players| {
            players
                .iter()
                .filter(|player| {
                    player.get("steamid").is_some() && player.get("personaname").is_some()
                })
                .collect()
        })
        .unwrap_or_default();

    if valid_players.is_empty() {
        tracing::warn!(steam_id, "Steam Web API returned no valid players to cache");
        return Ok(body);
    }

    let mut cached = read_cache_array(app_handle)?;

    for player in valid_players {
        let player_steam_id = player.get("steamid").and_then(Value::as_str);
        cached.retain(|summary| {
            summary["response"]["players"][0]["steamid"].as_str() != player_steam_id
        });
        cached.push(json!({ "response": { "players": [player] } }));
    }

    write_cache(app_handle, &cached)?;

    Ok(body)
}

pub fn read_cache(app_handle: &AppHandle) -> AppResult<Value> {
    Ok(Value::Array(read_cache_array(app_handle)?))
}

pub fn delete_cache(app_handle: &AppHandle) -> AppResult<()> {
    let path = cache_file_path(app_handle)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| AppError::SummaryCacheIo(e.to_string()))?;
    }
    Ok(())
}

fn cache_file_path(app_handle: &AppHandle) -> AppResult<std::path::PathBuf> {
    Ok(platform::cache_dir(app_handle)?.join(CACHE_FILE_NAME))
}

fn read_cache_array(app_handle: &AppHandle) -> AppResult<Vec<Value>> {
    let path = cache_file_path(app_handle)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::SummaryCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    serde_json::from_str(&contents).map_err(|e| AppError::SummaryCacheIo(e.to_string()))
}

fn write_cache(app_handle: &AppHandle, cached: &[Value]) -> AppResult<()> {
    let path = cache_file_path(app_handle)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::SummaryCacheIo(e.to_string()))?;
    }
    atomic_write_json(&path, cached).map_err(|e| AppError::SummaryCacheIo(e.to_string()))
}
