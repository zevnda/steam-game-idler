//! Persists a merged owned-games list per account, keyed by the account's resolved SteamID64 (the
//! same identifier for both sign-in modes - CLI mode already has one from `loginusers.vdf`, agent
//! mode learns one from the daemon's `status_changed` event, see `steam_agent::process`). Mirrors
//! `local_steam::steam_web_api`'s cache pattern (`fs_utils::atomic_write_json` under
//! `platform::cache_dir`), one subdirectory per account like `main`'s `get_games_list` cache.

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

use super::OwnedGame;

const CACHE_FILE_NAME: &str = "owned_games.json";

#[derive(Debug, Serialize, Deserialize)]
struct CachedGames {
    games: Vec<OwnedGame>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

pub fn read(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<OwnedGame>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents = fs::read_to_string(&path).map_err(|e| AppError::GamesCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedGames =
        serde_json::from_str(&contents).map_err(|e| AppError::GamesCacheIo(e.to_string()))?;
    Ok(cached.games)
}

pub fn write(app_handle: &AppHandle, steam_id: &str, games: &[OwnedGame]) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::GamesCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedGames {
            games: games.to_vec(),
        },
    )
    .map_err(|e| AppError::GamesCacheIo(e.to_string()))
}

pub fn delete(app_handle: &AppHandle, steam_id: &str) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| AppError::GamesCacheIo(e.to_string()))?;
    }
    Ok(())
}
