//! Persists one account's card-farming blacklist (app IDs the user has explicitly excluded from
//! ever being farmed), keyed by resolved SteamID64 - same layout/locking pattern as [`super::queue`]
//! (its own file, one process-wide lock across each read-modify-write cycle, mutations from
//! independent interactive clicks rather than a whole-list replace). Kept as its own module/file
//! rather than a field on `CardFarmingSettings` for the same reason `queue` already is: entries need
//! a `name` for display (a "Blacklisted" tab lists them the same way the Queue tab lists queue
//! entries) and get added/removed one at a time, not saved as part of a settings-tab form.
//!
//! Enforced in two places (see `commands.rs`): `get_games_with_drops` filters blacklisted app IDs
//! out of the browse list entirely, and `start_farming` filters them out of the queued set before
//! a cycle ever starts, so a game can never be farmed while blacklisted regardless of stale queue
//! data.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const CACHE_FILE_NAME: &str = "card_farming_blacklist.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// One blacklisted game - mirrors [`super::CardFarmingQueueEntry`]'s shape/reasoning exactly
/// (`name` stored alongside `app_id` so the Blacklisted tab can render an entry without a fresh
/// `get_games_with_drops` call resolving it).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardFarmingBlacklistEntry {
    pub app_id: u32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CachedBlacklist {
    blacklist: Vec<CardFarmingBlacklistEntry>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

fn read_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents = fs::read_to_string(&path)
        .map_err(|e| AppError::CardFarmingBlacklistCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedBlacklist = serde_json::from_str(&contents)
        .map_err(|e| AppError::CardFarmingBlacklistCacheIo(e.to_string()))?;
    Ok(cached.blacklist)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    blacklist: &[CardFarmingBlacklistEntry],
) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| AppError::CardFarmingBlacklistCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedBlacklist {
            blacklist: blacklist.to_vec(),
        },
    )
    .map_err(|e| AppError::CardFarmingBlacklistCacheIo(e.to_string()))
}

pub async fn read(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Adds `game` if no entry with the same `app_id` already exists - idempotent, not an error, if
/// it's already blacklisted. Returns the resulting full blacklist.
pub async fn add(
    app_handle: &AppHandle,
    steam_id: &str,
    game: CardFarmingBlacklistEntry,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut blacklist = read_unlocked(app_handle, steam_id)?;
    if !blacklist.iter().any(|g| g.app_id == game.app_id) {
        blacklist.push(game);
        write_unlocked(app_handle, steam_id, &blacklist)?;
    }
    Ok(blacklist)
}

/// Removes any entry matching `app_id` - idempotent, not an error, if it isn't blacklisted.
/// Returns the resulting full blacklist.
pub async fn remove(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut blacklist = read_unlocked(app_handle, steam_id)?;
    blacklist.retain(|g| g.app_id != app_id);
    write_unlocked(app_handle, steam_id, &blacklist)?;
    Ok(blacklist)
}

/// Empties the whole blacklist - mirrors `queue::set_order`'s bulk-replace, used by the
/// Blacklisted tab's "Clear" action. Always returns an empty vec.
pub async fn clear(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &[])?;
    Ok(Vec::new())
}
