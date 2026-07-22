//! Per-account owned-games scope setting - agent-mode only, no CLI-mode equivalent (CLI mode
//! always uses the curated whitelist as its ownership-check candidate list, see
//! `local_steam::ownership`). Steam-id-scoped file, mirroring `presence_settings`'s pattern
//! (typed whole-struct get/set, self-healing on a corrupt/unreadable file).
//!
//! Agent mode's own ownership check (`OwnershipManager.GetOwnedGamesAsync`) can optionally
//! intersect against the same curated whitelist CLI mode's `SteamworksLocalBackend` always uses,
//! matching CLI mode's scope (games + family-shared only). `games_only` defaults to `true` - some
//! users specifically want the unfiltered DLC/soundtracks/videos/tools scope instead, so it's an
//! explicit opt-out, not an opt-in. Family Sharing / borrowed games are included either way -
//! that's inherent to PICS-resolved ownership, not something this setting affects.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const SETTINGS_FILE_NAME: &str = "ownership_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnershipSettings {
    /// Defaults to `true` (games + family-shared only, matching CLI mode's scope) - an existing
    /// agent-mode account with no saved preference gets the games-only scope on first fetch after
    /// upgrading, and can opt back into the unfiltered "all content" scope via the setting.
    pub games_only: bool,
}

impl Default for OwnershipSettings {
    fn default() -> Self {
        Self { games_only: true }
    }
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<OwnershipSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(OwnershipSettings::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::OwnershipSettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(OwnershipSettings::default());
    }

    match serde_json::from_str(&contents) {
        Ok(settings) => Ok(settings),
        Err(e) => {
            // Self-heal to defaults rather than hard-failing every read for this account - see
            // `achievement_unlocker::settings::read_unlocked`'s matching comment for why.
            tracing::warn!(
                steam_id,
                error = %e,
                "ownership settings: ownership_settings.json failed to parse, resetting to defaults"
            );
            let defaults = OwnershipSettings::default();
            write_unlocked(app_handle, steam_id, &defaults)?;
            Ok(defaults)
        }
    }
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: &OwnershipSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::OwnershipSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, settings).map_err(|e| AppError::OwnershipSettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<OwnershipSettings> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Whole-struct replace, not a dot-path merge - same convention as every other typed settings
/// module (see `achievement_unlocker::settings::set`'s doc comment).
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: OwnershipSettings,
) -> AppResult<OwnershipSettings> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &settings)?;
    Ok(settings)
}
