//! Persists one account's auto-idle queue, keyed by resolved SteamID64 - mirrors
//! `favorites::cache` exactly (same `atomic_write_json`-under-`platform::cache_dir` layout, same
//! single process-wide write lock held across each read-modify-write cycle, for the same reason:
//! this list is mutated by frequent independent user actions - add/remove/enable-toggle - not a
//! hot path, but real races are possible without one lock covering the whole cycle).

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

use super::AutoIdleEntry;

const CACHE_FILE_NAME: &str = "auto_idle.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Serialize, Deserialize)]
struct CachedAutoIdle {
    games: Vec<AutoIdleEntry>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<AutoIdleEntry>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::AutoIdleCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedAutoIdle =
        serde_json::from_str(&contents).map_err(|e| AppError::AutoIdleCacheIo(e.to_string()))?;
    Ok(cached.games)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    games: &[AutoIdleEntry],
) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::AutoIdleCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedAutoIdle {
            games: games.to_vec(),
        },
    )
    .map_err(|e| AppError::AutoIdleCacheIo(e.to_string()))
}

pub async fn read(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<AutoIdleEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Adds `game` if no entry with the same `app_id` already exists (defaulting to `enabled: true`,
/// matching `main`'s "newly added games are on by default" behavior) - idempotent, not an error,
/// if it's already queued. Returns the resulting full list.
pub async fn add(
    app_handle: &AppHandle,
    steam_id: &str,
    game: AutoIdleEntry,
) -> AppResult<Vec<AutoIdleEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut games = read_unlocked(app_handle, steam_id)?;
    if !games.iter().any(|g| g.app_id == game.app_id) {
        games.push(game);
        write_unlocked(app_handle, steam_id, &games)?;
    }
    Ok(games)
}

/// Removes any entry matching `app_id` - idempotent, not an error, if it isn't queued. Returns the
/// resulting full list.
pub async fn remove(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Vec<AutoIdleEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut games = read_unlocked(app_handle, steam_id)?;
    games.retain(|g| g.app_id != app_id);
    write_unlocked(app_handle, steam_id, &games)?;
    Ok(games)
}

/// Bulk-replaces the whole list, preserving the given order - used after drag-reorder.
pub async fn set_order(
    app_handle: &AppHandle,
    steam_id: &str,
    games: Vec<AutoIdleEntry>,
) -> AppResult<Vec<AutoIdleEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &games)?;
    Ok(games)
}

/// Flips one entry's `enabled` flag - a no-op (not an error) if `app_id` isn't queued. Returns the
/// resulting full list.
pub async fn set_enabled(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    enabled: bool,
) -> AppResult<Vec<AutoIdleEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut games = read_unlocked(app_handle, steam_id)?;
    if let Some(game) = games.iter_mut().find(|g| g.app_id == app_id) {
        game.enabled = enabled;
        write_unlocked(app_handle, steam_id, &games)?;
    }
    Ok(games)
}
