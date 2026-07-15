//! Persists one account's marketable inventory fetch, keyed by resolved SteamID64 - same layout
//! pattern as `favorites::cache`/`games::cache` (`fs_utils::atomic_write_json` under
//! `platform::cache_dir`). Unlike favorites (mutated by frequent independent clicks), this cache is
//! only ever replaced wholesale by a full `get_inventory` refetch or cleared by
//! `delete_inventory_cache` - no read-modify-write race to guard against, so no process-wide lock is
//! needed here (mirrors `games::cache`'s same reasoning, not favorites').

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

use super::InventoryItem;

const CACHE_FILE_NAME: &str = "inventory.json";

#[derive(Debug, Serialize, Deserialize)]
struct CachedInventory {
    items: Vec<InventoryItem>,
}

fn cache_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(CACHE_FILE_NAME))
}

/// The cached inventory for `steam_id` - an empty list if nothing has been cached yet (not an
/// error, same convention `get_owned_games_cache` already uses).
pub fn read(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<InventoryItem>> {
    let path = cache_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::InventoryCacheIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let cached: CachedInventory =
        serde_json::from_str(&contents).map_err(|e| AppError::InventoryCacheIo(e.to_string()))?;
    Ok(cached.items)
}

pub fn write(app_handle: &AppHandle, steam_id: &str, items: &[InventoryItem]) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::InventoryCacheIo(e.to_string()))?;
    }
    atomic_write_json(
        &path,
        &CachedInventory {
            items: items.to_vec(),
        },
    )
    .map_err(|e| AppError::InventoryCacheIo(e.to_string()))
}

pub fn delete(app_handle: &AppHandle, steam_id: &str) -> AppResult<()> {
    let path = cache_file_path(app_handle, steam_id)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| AppError::InventoryCacheIo(e.to_string()))?;
    }
    Ok(())
}
