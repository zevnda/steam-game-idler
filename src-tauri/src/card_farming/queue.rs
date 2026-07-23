//! Persists one account's card-farming queue, keyed by resolved SteamID64 - same layout pattern as
//! `achievement_unlocker::cache`/`favorites::cache` (`fs_utils::atomic_write_json` under
//! `platform::cache_dir`), one subdirectory per account, one process-wide lock held across each
//! read-modify-write cycle since queue mutations come from independent interactive clicks (add/
//! remove one game at a time) rather than a single whole-list replace.
//!
//! This queue is what `start_farming` actually farms (see `commands.rs`'s doc comment on
//! `start_farming`/`manager.rs`'s `start()`) - nothing runs until a game is queued here, matching
//! achievement-unlocker's own "queue first, then start" model rather than this feature's previous
//! "farm every game with drops automatically" behavior.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

use super::CardFarmingQueueEntry;

const CACHE_FILE_NAME: &str = "card_farming_queue.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Serialize, Deserialize)]
struct CachedQueue {
    queue: Vec<CardFarmingQueueEntry>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::CardFarmingQueueCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedQueue = serde_json::from_str(&contents)
        .map_err(|e| AppError::CardFarmingQueueCacheIo(e.to_string()))?;
    Ok(cached.queue)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    queue: &[CardFarmingQueueEntry],
) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::CardFarmingQueueCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedQueue {
            queue: queue.to_vec(),
        },
    )
    .map_err(|e| AppError::CardFarmingQueueCacheIo(e.to_string()))
}

pub async fn read(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Adds `game` if no entry with the same `app_id` already exists - idempotent, not an error, if
/// it's already queued. Returns the resulting full queue.
pub async fn add(
    app_handle: &AppHandle,
    steam_id: &str,
    game: CardFarmingQueueEntry,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut queue = read_unlocked(app_handle, steam_id)?;
    if !queue.iter().any(|g| g.app_id == game.app_id) {
        queue.push(game);
        write_unlocked(app_handle, steam_id, &queue)?;
    }
    Ok(queue)
}

/// Removes any entry matching `app_id` - idempotent, not an error, if it isn't queued. Returns the
/// resulting full queue.
pub async fn remove(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut queue = read_unlocked(app_handle, steam_id)?;
    queue.retain(|g| g.app_id != app_id);
    write_unlocked(app_handle, steam_id, &queue)?;
    Ok(queue)
}

/// Bulk-replaces the whole queue, preserving the given order - used after drag-reorder. This order
/// is read back by `manager::fetch_queued_games` when the account's `DropSortOrder::QueueOrder`
/// setting is active (the default), so a drag-reorder here directly changes the order games are
/// farmed in, not just their display order.
pub async fn set_order(
    app_handle: &AppHandle,
    steam_id: &str,
    queue: Vec<CardFarmingQueueEntry>,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &queue)?;
    Ok(queue)
}
