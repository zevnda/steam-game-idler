//! Per-account achievement-unlocker settings (unlock pacing/scheduling/toggles) and per-game
//! max-unlocks overrides - separate from `cache`/`commands` (the queue itself, i.e. *which* games
//! are enrolled). Persisted to its own file in the same per-SteamID64 directory the queue's cache
//! already uses, so this feature owns both its files rather than sharing one with the queue.
//!
//! A typed struct with a whole-object get/set, not a shared JSON blob mutated via dot-path string
//! keys - matches every other command surface's settings pattern in this codebase.
//!
//! Per-game max-unlocks overrides are scoped to this feature only, not a shared cross-feature
//! table - extract a shared helper only once another feature actually needs the same shape.

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const SETTINGS_FILE_NAME: &str = "achievement_unlocker_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// A schedule boundary time - just `hour`/`minute`, since the automation loop this gates only
/// ever needs that resolution to decide "are we in the allowed window right now."
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleTime {
    pub hour: u8,
    pub minute: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementUnlockerSettings {
    /// Skip achievements flagged `hidden` on Steam's own schema.
    pub hidden: bool,
    /// Idle the game (via `idling::claims::IdleClaimsRegistry`) while unlocking it.
    pub idle: bool,
    /// Multi-game concurrent unlocking - gamer-tier gated on the frontend (no Rust-side
    /// enforcement). Persisted here regardless of the account's actual tier; it's the frontend's
    /// job to decide whether to let the user turn this on.
    pub multiple_games: bool,
    /// Random delay range (minutes) between unlocking consecutive achievements: `[min, max]`.
    pub interval: [u32; 2],
    pub schedule: bool,
    pub schedule_from: ScheduleTime,
    pub schedule_to: ScheduleTime,
    pub next_task_checkbox: bool,
    /// What to start once the queue empties: `"cardFarming"` or `"autoIdle"`, matching `main`'s two
    /// options - see `achievement_unlocker::manager::maybe_start_next_task`. Deliberately a loose
    /// string, not an enum: this field is a settings value round-tripped from the frontend, and an
    /// enum here would need to stay in lockstep with whatever string literals the frontend's own
    /// task-picker UI uses, for no real safety benefit over just matching on the string once, where
    /// `maybe_start_next_task` already does.
    pub next_task: Option<String>,
}

impl Default for AchievementUnlockerSettings {
    /// Mirrors `main`'s `settings.rs::get_default_settings`'s `achievementUnlocker` defaults
    /// exactly, so an account migrating from `main`'s behavior sees the same starting point.
    fn default() -> Self {
        Self {
            hidden: false,
            idle: true,
            multiple_games: false,
            interval: [30, 130],
            schedule: false,
            schedule_from: ScheduleTime {
                hour: 8,
                minute: 30,
            },
            schedule_to: ScheduleTime {
                hour: 23,
                minute: 0,
            },
            next_task_checkbox: false,
            next_task: None,
        }
    }
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct CachedSettings {
    #[serde(default)]
    settings: AchievementUnlockerSettings,
    #[serde(default)]
    per_game_max_unlocks: HashMap<u32, u32>,
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<CachedSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(CachedSettings::default());
    }

    let contents = fs::read_to_string(&path)
        .map_err(|e| AppError::AchievementUnlockerSettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(CachedSettings::default());
    }

    match serde_json::from_str(&contents) {
        Ok(cached) => Ok(cached),
        Err(e) => {
            // Self-heal to defaults rather than hard-failing every read for this account - see
            // `card_farming::settings::read_unlocked`'s matching comment for why.
            tracing::warn!(
                steam_id,
                error = %e,
                "achievement unlocker: achievement_unlocker_settings.json failed to parse, resetting to defaults"
            );
            let defaults = CachedSettings::default();
            write_unlocked(app_handle, steam_id, &defaults)?;
            Ok(defaults)
        }
    }
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    cached: &CachedSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| AppError::AchievementUnlockerSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, cached)
        .map_err(|e| AppError::AchievementUnlockerSettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<AchievementUnlockerSettings> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?.settings)
}

/// Whole-struct replace, not a dot-path merge - the frontend always has the full settings object
/// on hand (it just fetched it via `get`), so there's no partial-update case to support.
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: AchievementUnlockerSettings,
) -> AppResult<AchievementUnlockerSettings> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    cached.settings = settings;
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.settings)
}

pub async fn get_max_unlocks(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_unlocks
        .get(&app_id)
        .copied())
}

/// `max_unlocks: None` clears the override for `app_id` (removes the map entry) rather than
/// persisting an explicit "no limit" sentinel - same "absence means no override" convention
/// `settings::commands::set_steam_web_api_key` already uses for its own optional override.
pub async fn set_max_unlocks(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    max_unlocks: Option<u32>,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    match max_unlocks {
        Some(value) => {
            cached.per_game_max_unlocks.insert(app_id, value);
        }
        None => {
            cached.per_game_max_unlocks.remove(&app_id);
        }
    }
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(max_unlocks)
}

/// App IDs with an active per-game override - see `idling::settings::customized_app_ids`'s doc
/// comment for why the map's keys alone are the answer.
pub async fn customized_app_ids(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_unlocks
        .into_keys()
        .collect())
}

/// Clears both `.settings` *and* every per-game max-unlocks override, for the Debug tab's "Reset
/// Settings" action - unlike [`set`] (which deliberately only touches `.settings`, see its doc
/// comment), a full reset needs to wipe the per-game map too or a game's override would silently
/// survive the reset.
pub async fn reset(app_handle: &AppHandle, steam_id: &str) -> AppResult<AchievementUnlockerSettings> {
    let _guard = WRITE_LOCK.lock().await;
    let cached = CachedSettings::default();
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.settings)
}
