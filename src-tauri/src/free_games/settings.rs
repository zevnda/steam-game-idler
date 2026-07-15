//! Per-account free-games settings - just the gamer-tier-gated auto-redeem toggle. Persisted to
//! its own file in the same per-SteamID64 directory `achievement_unlocker::settings`/
//! `card_farming::settings` use this same pattern for (own typed struct, own file, whole-struct
//! get/set).
//!
//! **Deliberately per-account, unlike `free_game_notifications`** (see `settings::Settings`'s doc
//! comment) - discovery itself has no account concept, but *redeeming* a free game always grants a
//! license to one specific signed-in Steam account, so which accounts have auto-redeem turned on is
//! inherently per-account.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const SETTINGS_FILE_NAME: &str = "free_games_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreeGamesSettings {
    /// Gamer-tier-gated (no Rust-side enforcement): whether
    /// `useFreeGamesWatcher.ts`'s background poll should automatically call `claim_free_game` for
    /// this account whenever a new free game is discovered. For a CLI-mode account, turning this on
    /// is also when the frontend calls `ensure_free_games_store_session` to establish (or refresh)
    /// this account's persisted Steam store session up front, rather than surprising the user with
    /// a login window during an unattended background poll later - see `free_games::commands`'s
    /// doc comment on that command.
    pub auto_redeem: bool,
}

impl Default for FreeGamesSettings {
    fn default() -> Self {
        Self { auto_redeem: false }
    }
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<FreeGamesSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(FreeGamesSettings::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::FreeGamesSettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(FreeGamesSettings::default());
    }

    match serde_json::from_str(&contents) {
        Ok(settings) => Ok(settings),
        Err(e) => {
            // Self-heal to defaults rather than hard-failing every read for this account - see
            // `card_farming::settings::read_unlocked`'s matching comment for why.
            tracing::warn!(
                steam_id,
                error = %e,
                "free games: free_games_settings.json failed to parse, resetting to defaults"
            );
            let defaults = FreeGamesSettings::default();
            write_unlocked(app_handle, steam_id, &defaults)?;
            Ok(defaults)
        }
    }
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: &FreeGamesSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::FreeGamesSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, settings).map_err(|e| AppError::FreeGamesSettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<FreeGamesSettings> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Whole-struct replace, not a dot-path merge - same reasoning as
/// `achievement_unlocker::settings::set`.
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: FreeGamesSettings,
) -> AppResult<FreeGamesSettings> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &settings)?;
    Ok(settings)
}
