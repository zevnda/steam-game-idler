//! Persists one account's favorited-games list, keyed by resolved SteamID64 - same layout pattern
//! as `games::cache` (`fs_utils::atomic_write_json` under `platform::cache_dir`), one subdirectory
//! per account.
//!
//! Unlike `games::cache` (which only ever replaces its whole cached list once per full refetch),
//! favorites are mutated by frequent, independent user clicks (add/remove one game at a time), so
//! two rapid mutations really can race: both read the file before either writes, and whichever
//! write lands last silently drops the other's change. A single process-wide lock held for the
//! full read-modify-write cycle closes that gap. One lock for the whole cache (not a per-account
//! or per-path map, unlike the reference app's `custom_lists.rs`) is proportionate here since this
//! module only ever manages one list per account and mutation volume is low (interactive clicks,
//! not a hot path).

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

use super::FavoriteEntry;

const CACHE_FILE_NAME: &str = "favorites.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Serialize, Deserialize)]
struct CachedFavorites {
    favorites: Vec<FavoriteEntry>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<FavoriteEntry>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::FavoritesCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedFavorites =
        serde_json::from_str(&contents).map_err(|e| AppError::FavoritesCacheIo(e.to_string()))?;
    Ok(cached.favorites)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    favorites: &[FavoriteEntry],
) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::FavoritesCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedFavorites {
            favorites: favorites.to_vec(),
        },
    )
    .map_err(|e| AppError::FavoritesCacheIo(e.to_string()))
}

pub async fn read(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<FavoriteEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Adds `game` if no entry with the same `app_id` already exists - idempotent, not an error, if
/// it's already favorited. Returns the resulting full list.
pub async fn add(
    app_handle: &AppHandle,
    steam_id: &str,
    game: FavoriteEntry,
) -> AppResult<Vec<FavoriteEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut favorites = read_unlocked(app_handle, steam_id)?;
    if !favorites.iter().any(|f| f.app_id == game.app_id) {
        favorites.push(game);
        write_unlocked(app_handle, steam_id, &favorites)?;
    }
    Ok(favorites)
}

/// Removes any entry matching `app_id` - idempotent, not an error, if it isn't favorited. Returns
/// the resulting full list.
pub async fn remove(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Vec<FavoriteEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut favorites = read_unlocked(app_handle, steam_id)?;
    favorites.retain(|f| f.app_id != app_id);
    write_unlocked(app_handle, steam_id, &favorites)?;
    Ok(favorites)
}

/// Bulk-replaces the whole list, preserving the given order - used after drag-reorder.
pub async fn set_order(
    app_handle: &AppHandle,
    steam_id: &str,
    favorites: Vec<FavoriteEntry>,
) -> AppResult<Vec<FavoriteEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &favorites)?;
    Ok(favorites)
}
