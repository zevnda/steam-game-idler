//! Per-game achievement ordering/skip/delay for one account - a separate file per game
//! (`<steam_id>/achievement_order/<app_id>.json`), unlike `cache.rs`/`settings.rs`'s single
//! per-account file, since this is genuinely per-game data. `main`'s equivalent
//! (`custom_lists.rs::get_achievement_order`/`save_achievement_order`) already uses this same
//! per-game-file layout (`achievement_data/{app_id}_order.json`) rather than one blob - the right
//! granularity to port forward, just typed instead of an untyped `serde_json::Value`.
//!
//! **Deliberately lean compared to `main`'s stored shape**: `main` persists the *entire*
//! `Achievement` object (name/description/icons/achieved/percent, all duplicated from
//! `get_achievement_data`) inside the saved order, which is why its frontend has to reconcile a
//! stale `achieved` flag against a fresh fetch every time it loads
//! (`AchievementOrderPage.tsx:416-436`). Step 14's `AchievementDto` (`crate::achievements`) is
//! already the source of truth for that data, so this file only stores what's genuinely
//! order-specific: an achievement's stable schema `id`, whether it's skipped, and its
//! per-achievement delay. The future order-editor frontend merges by `id` against a live
//! `get_achievement_data` call instead of trusting a saved copy.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, LazyLock, Mutex as StdMutex};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

/// One achievement's position (implicit via `Vec` order), skip flag, and per-achievement delay.
/// `id` matches `AchievementDto::id` (Steam's schema `apiname`), not its display `name` -
/// `main`'s order editor keys off `Achievement.name` for drag-and-drop identity, but that's a
/// display string that isn't guaranteed unique; `id` is the same stable key
/// `set_achievement`/`ImportTimingsModal` already match against on `main`'s side too.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementOrderEntry {
    pub id: String,
    #[serde(default)]
    pub skip: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delay_next_unlock: Option<f64>,
}

/// A saved custom order for one game. `delay_before_first_unlock` is minutes, fractional (matches
/// `main`'s `step={0.1}` input and the import-timings feature's sub-minute-precision math).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementOrder {
    pub achievements: Vec<AchievementOrderEntry>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delay_before_first_unlock: Option<f64>,
}

const ORDER_DIR_NAME: &str = "achievement_order";

/// Per-path lock map - this module's first departure from every prior `achievement_unlocker`/
/// `favorites`/`games` cache file, which each own exactly one file per account and so get away
/// with a single `LazyLock<Mutex<()>>`. A per-game file layout needs a lock keyed by path instead,
/// otherwise concurrent saves for two different games would serialize on a lock neither needs.
/// Ports the concept (not the code) of `main`'s `custom_lists.rs::LIST_FILE_LOCKS`, which solved
/// this identical problem for its own per-list files.
static FILE_LOCKS: LazyLock<StdMutex<HashMap<PathBuf, Arc<Mutex<()>>>>> =
    LazyLock::new(|| StdMutex::new(HashMap::new()));

fn lock_for_path(path: &PathBuf) -> Arc<Mutex<()>> {
    let mut locks = FILE_LOCKS.lock().unwrap();
    locks
        .entry(path.clone())
        .or_insert_with(|| Arc::new(Mutex::new(())))
        .clone()
}

fn order_file_path(app_handle: &AppHandle, steam_id: &str, app_id: u32) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(ORDER_DIR_NAME)
        .join(format!("{app_id}.json")))
}

/// `None` if this game has never had a custom order saved - matches `main`'s `null` case, not an
/// error.
pub async fn get(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<AchievementOrder>> {
    let path = order_file_path(app_handle, steam_id, app_id)?;
    let lock = lock_for_path(&path);
    let _guard = lock.lock().await;

    if !path.exists() {
        return Ok(None);
    }

    let contents =
        std::fs::read_to_string(&path).map_err(|e| AppError::AchievementOrderIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(None);
    }

    serde_json::from_str(&contents)
        .map(Some)
        .map_err(|e| AppError::AchievementOrderIo(e.to_string()))
}

/// Whole-replace, not a merge - the frontend always has the full order on hand (it just loaded or
/// built it), same convention as `settings::set`/`cache::set_order`.
pub async fn save(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    order: AchievementOrder,
) -> AppResult<AchievementOrder> {
    let path = order_file_path(app_handle, steam_id, app_id)?;
    let lock = lock_for_path(&path);
    let _guard = lock.lock().await;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::AchievementOrderIo(e.to_string()))?;
    }
    atomic_write_json(&path, &order).map_err(|e| AppError::AchievementOrderIo(e.to_string()))?;
    Ok(order)
}
