//! Persists one account's card-farming whitelist, keyed by resolved SteamID64 - same layout/locking
//! pattern as [`super::blacklist`] (its own file, one process-wide lock across each
//! read-modify-write cycle, mutations from independent interactive clicks rather than a whole-list
//! replace). Unlike the blacklist, this list is *scope*, not exclusion: when non-empty, only its
//! members are ever farmed. It has no order of its own - see `manager`'s module doc comment for why
//! ordering is always automatic - and the app prunes it as aggressively as the user populates it:
//! `manager::resolve_candidates` removes any member that becomes ineligible for any reason (drained,
//! blacklisted, filtered out by a skip setting, still in the refund window) every outer-loop
//! iteration, reporting a precise reason each time. The user only ever adds to it, from the "games
//! with drops" browse tab.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const CACHE_FILE_NAME: &str = "card_farming_whitelist.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// One whitelisted game - mirrors [`super::CardFarmingBlacklistEntry`]'s shape/reasoning exactly
/// (`name` stored alongside `app_id` so the Whitelist tab can render an entry without a fresh
/// `get_games_with_drops` call resolving it).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardFarmingWhitelistEntry {
    pub app_id: u32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CachedWhitelist {
    whitelist: Vec<CardFarmingWhitelistEntry>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

fn read_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents = fs::read_to_string(&path)
        .map_err(|e| AppError::CardFarmingWhitelistCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedWhitelist = serde_json::from_str(&contents)
        .map_err(|e| AppError::CardFarmingWhitelistCacheIo(e.to_string()))?;
    Ok(cached.whitelist)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    whitelist: &[CardFarmingWhitelistEntry],
) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| AppError::CardFarmingWhitelistCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedWhitelist {
            whitelist: whitelist.to_vec(),
        },
    )
    .map_err(|e| AppError::CardFarmingWhitelistCacheIo(e.to_string()))
}

pub async fn read(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Adds `game` if no entry with the same `app_id` already exists - idempotent, not an error, if
/// it's already whitelisted. Returns the resulting full whitelist.
pub async fn add(
    app_handle: &AppHandle,
    steam_id: &str,
    game: CardFarmingWhitelistEntry,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut whitelist = read_unlocked(app_handle, steam_id)?;
    if !whitelist.iter().any(|g| g.app_id == game.app_id) {
        whitelist.push(game);
        write_unlocked(app_handle, steam_id, &whitelist)?;
    }
    Ok(whitelist)
}

/// Removes any entry matching `app_id` - idempotent, not an error, if it isn't whitelisted. Returns
/// the resulting full whitelist. Called both by the user (removing an entry from the Whitelist tab)
/// and automatically by `manager::resolve_candidates` (pruning an entry that's become ineligible).
pub async fn remove(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut whitelist = read_unlocked(app_handle, steam_id)?;
    whitelist.retain(|g| g.app_id != app_id);
    write_unlocked(app_handle, steam_id, &whitelist)?;
    Ok(whitelist)
}

/// Empties the whole whitelist - used by the Whitelist tab's "Clear" action.
pub async fn clear(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &[])?;
    Ok(Vec::new())
}
