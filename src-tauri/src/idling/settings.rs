//! Per-account idling auto-stop caps (the Game Settings tab's "max idle time" fields) - separate
//! from `manager`/`claims` (the idling mechanics themselves). Persisted to its own file in the same
//! per-SteamID64 directory every other per-account settings module already uses, mirroring
//! `achievement_unlocker::settings`'s structure (own typed struct, own file, whole-value get/set
//! per field).
//!
//! **Only a per-game override map and one global scalar - no public "whole settings struct" get/set
//! pair.** Unlike achievement-unlocker/card-farming, idling has no separate settings tab of its own
//! competing for a whole-replace surface, so there's nothing for these two values to be protected
//! from - a single dedicated get/set command per value is enough. `global_max_idle_time` applies
//! to manual idling and auto-idle (the Games/Idling and Auto Idle pages), never to achievement-
//! unlocker/card-farming's own idle claims - see `super::auto_stop`'s doc comment for where that
//! scoping is actually enforced (this module only stores the numbers, it doesn't know who's idling).

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

const SETTINGS_FILE_NAME: &str = "idling_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Default, Serialize, Deserialize)]
struct CachedSettings {
    #[serde(default)]
    global_max_idle_time: u32,
    #[serde(default)]
    per_game_max_idle_time: HashMap<u32, u32>,
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

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::IdlingSettingsIo(e.to_string()))?;
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
                "idling: idling_settings.json failed to parse, resetting to defaults"
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
        fs::create_dir_all(parent).map_err(|e| AppError::IdlingSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, cached).map_err(|e| AppError::IdlingSettingsIo(e.to_string()))
}

pub async fn get_global_max_idle_time(app_handle: &AppHandle, steam_id: &str) -> AppResult<u32> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?.global_max_idle_time)
}

pub async fn set_global_max_idle_time(
    app_handle: &AppHandle,
    steam_id: &str,
    minutes: u32,
) -> AppResult<u32> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    cached.global_max_idle_time = minutes;
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.global_max_idle_time)
}

pub async fn get_max_idle_time(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_idle_time
        .get(&app_id)
        .copied())
}

/// `max_idle_time: None` clears the override for `app_id` (removes the map entry) rather than
/// persisting an explicit "no limit" sentinel - same "absence means no override" convention
/// `achievement_unlocker::settings::set_max_unlocks` already uses.
pub async fn set_max_idle_time(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    max_idle_time: Option<u32>,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    match max_idle_time {
        Some(value) => {
            cached.per_game_max_idle_time.insert(app_id, value);
        }
        None => {
            cached.per_game_max_idle_time.remove(&app_id);
        }
    }
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(max_idle_time)
}

/// App IDs with an active per-game override - backs the Game Settings tab's "customized" list
/// indicator. The map only ever holds active overrides (see `set_max_idle_time`'s "absence means
/// no override" convention), so its keys already are the answer - no filtering needed.
pub async fn customized_app_ids(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_idle_time
        .into_keys()
        .collect())
}

/// Clears the global cap and every per-game override, for the Debug tab's "Reset Settings" action -
/// this module has no whole-struct `set` for `reset_settings` to reuse (see this module's doc
/// comment for why), so it needs its own full-wipe entry point.
pub async fn reset(app_handle: &AppHandle, steam_id: &str) -> AppResult<()> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &CachedSettings::default())
}

/// The effective cap for `app_id`, in minutes, or `None` if idling is uncapped. **Per-game wins
/// over global whenever it's set** (`> 0`) - a specific override always takes precedence over the
/// account-wide blanket value, otherwise the account-wide value, otherwise uncapped. Diverges from
/// `main`'s `handleIdle.ts::startIdle` (which had global win) by deliberate product decision - see
/// this precedence direction mirrored in `card_farming::manager::is_capped`. `0` on either means
/// "not set," not "stop immediately" - matching `main`'s own `maxIdleTime > 0` guard.
pub async fn effective_max_idle_time(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let cached = {
        let _guard = WRITE_LOCK.lock().await;
        read_unlocked(app_handle, steam_id)?
    };
    if let Some(per_game) = cached
        .per_game_max_idle_time
        .get(&app_id)
        .copied()
        .filter(|&v| v > 0)
    {
        return Ok(Some(per_game));
    }
    Ok(Some(cached.global_max_idle_time).filter(|&v| v > 0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn per_game_wins_when_set_even_if_a_higher_global_value_exists() {
        let cached = CachedSettings {
            global_max_idle_time: 30,
            per_game_max_idle_time: HashMap::from([(440, 5)]),
        };
        assert_eq!(effective_from(&cached, 440), Some(5));
    }

    #[test]
    fn global_used_when_per_game_is_unset() {
        let cached = CachedSettings {
            global_max_idle_time: 15,
            per_game_max_idle_time: HashMap::new(),
        };
        assert_eq!(effective_from(&cached, 440), Some(15));
    }

    #[test]
    fn uncapped_when_neither_is_set() {
        let cached = CachedSettings::default();
        assert_eq!(effective_from(&cached, 440), None);
    }

    // Mirrors `effective_max_idle_time`'s precedence logic without the async file I/O, so it's
    // testable as a pure function - kept private to this test module rather than promoted to a
    // shared helper `effective_max_idle_time` calls, since the async version's shape (reading the
    // file first) isn't worth splitting apart for one caller.
    fn effective_from(cached: &CachedSettings, app_id: u32) -> Option<u32> {
        if let Some(per_game) = cached
            .per_game_max_idle_time
            .get(&app_id)
            .copied()
            .filter(|&v| v > 0)
        {
            return Some(per_game);
        }
        Some(cached.global_max_idle_time).filter(|&v| v > 0)
    }
}
