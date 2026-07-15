//! Per-account presence settings (persona state shown to friends, custom idling status text) -
//! agent-mode only, no CLI-mode equivalent. Steam-id-scoped file, mirroring
//! `achievement_unlocker::settings`'s pattern (typed whole-struct get/set, self-healing on a
//! corrupt/unreadable file).
//!
//! `SetPersonaState` is freely settable any time post-login for Online/Busy/Snooze/Away (confirmed
//! live); the remaining `PersonaState` variants (LookingToTrade/LookingToPlay/Invisible/Offline) use
//! the identical call and are exposed on the same assumption but weren't individually live-tested.
//! Custom idle status text
//! (`CMsgClientGamesPlayed.GamePlayed.game_extra_info`) fully replaces "Playing <game>" for
//! friends, but *only* when paired with a real, owned app id already being idled - Steam silently
//! ignores it otherwise, so this setting has no visible effect unless the account is also idling
//! at least one owned game.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const SETTINGS_FILE_NAME: &str = "presence_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// Mirrors SteamKit2's `EPersonaState` in full. Wire values match `EPersonaState`'s own variant
/// names exactly (case-insensitively parsed C#-side via `Enum.TryParse(..., ignoreCase: true)`,
/// so the casing here doesn't have to match byte-for-byte, but keeping it identical avoids the
/// need to think about it).
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PersonaState {
    Online,
    Busy,
    Away,
    Snooze,
    LookingToTrade,
    LookingToPlay,
    Invisible,
    Offline,
}

impl PersonaState {
    pub fn as_wire_str(self) -> &'static str {
        match self {
            PersonaState::Online => "Online",
            PersonaState::Busy => "Busy",
            PersonaState::Away => "Away",
            PersonaState::Snooze => "Snooze",
            PersonaState::LookingToTrade => "LookingToTrade",
            PersonaState::LookingToPlay => "LookingToPlay",
            PersonaState::Invisible => "Invisible",
            PersonaState::Offline => "Offline",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresenceSettings {
    /// Defaults to `Online`, matching the daemon's own pre-this-feature hardcoded behavior
    /// (`SteamBot.cs`'s `OnLoggedOn`) - an existing account with no saved preference sees no
    /// change.
    pub persona_state: PersonaState,
    /// `None`/empty means "no custom text" (default "Playing <game>" behavior). Always settable
    /// regardless of whether the account is currently idling - see this module's doc comment for
    /// why it has no visible effect until idling starts.
    pub custom_idle_status: Option<String>,
}

impl Default for PresenceSettings {
    fn default() -> Self {
        Self {
            persona_state: PersonaState::Online,
            custom_idle_status: None,
        }
    }
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<PresenceSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(PresenceSettings::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::PresenceSettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(PresenceSettings::default());
    }

    match serde_json::from_str(&contents) {
        Ok(settings) => Ok(settings),
        Err(e) => {
            // Self-heal to defaults rather than hard-failing every read for this account - see
            // `achievement_unlocker::settings::read_unlocked`'s matching comment for why.
            tracing::warn!(
                steam_id,
                error = %e,
                "presence settings: presence_settings.json failed to parse, resetting to defaults"
            );
            let defaults = PresenceSettings::default();
            write_unlocked(app_handle, steam_id, &defaults)?;
            Ok(defaults)
        }
    }
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: &PresenceSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::PresenceSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, settings).map_err(|e| AppError::PresenceSettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<PresenceSettings> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Whole-struct replace, not a dot-path merge - same convention as every other typed settings
/// module (see `achievement_unlocker::settings::set`'s doc comment).
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: PresenceSettings,
) -> AppResult<PresenceSettings> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &settings)?;
    Ok(settings)
}
