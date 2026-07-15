//! Per-account "max playtime" caps (the Game Settings tab's "Max playtime (all games)"/"Max
//! playtime" fields) - persisted to its own file in the same per-SteamID64 directory every other
//! per-account settings module already uses, mirroring `idling::settings`'s structure (own typed
//! struct, own file, one global scalar + a per-game override map, no whole-struct get/set pair).
//!
//! **Not owned by one feature** - unlike `idling::settings`/`card_farming::settings`, this cap is
//! read by `idling`, `auto_idle`, `achievement_unlocker`, and `card_farming` alike (see
//! `super`'s module doc comment), so it lives in its own top-level module rather than as sibling
//! fields on any one of theirs.

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

const SETTINGS_FILE_NAME: &str = "max_playtime_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Default, Serialize, Deserialize)]
struct CachedSettings {
    #[serde(default)]
    global_max_playtime: u32,
    #[serde(default)]
    per_game_max_playtime: HashMap<u32, u32>,
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
        fs::read_to_string(&path).map_err(|e| AppError::MaxPlaytimeSettingsIo(e.to_string()))?;
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
                "max playtime: max_playtime_settings.json failed to parse, resetting to defaults"
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
        fs::create_dir_all(parent).map_err(|e| AppError::MaxPlaytimeSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, cached).map_err(|e| AppError::MaxPlaytimeSettingsIo(e.to_string()))
}

pub async fn get_global_max_playtime(app_handle: &AppHandle, steam_id: &str) -> AppResult<u32> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?.global_max_playtime)
}

pub async fn set_global_max_playtime(
    app_handle: &AppHandle,
    steam_id: &str,
    minutes: u32,
) -> AppResult<u32> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    cached.global_max_playtime = minutes;
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.global_max_playtime)
}

pub async fn get_max_playtime(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_playtime
        .get(&app_id)
        .copied())
}

/// `max_playtime: None` clears the override for `app_id` (removes the map entry) rather than
/// persisting an explicit "no limit" sentinel - same "absence means no override" convention every
/// other per-game override setter in this codebase already uses.
pub async fn set_max_playtime(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    max_playtime: Option<u32>,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    match max_playtime {
        Some(value) => {
            cached.per_game_max_playtime.insert(app_id, value);
        }
        None => {
            cached.per_game_max_playtime.remove(&app_id);
        }
    }
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(max_playtime)
}

/// App IDs with an active per-game override - see `idling::settings::customized_app_ids`'s doc
/// comment for why the map's keys alone are the answer.
pub async fn customized_app_ids(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_playtime
        .into_keys()
        .collect())
}

/// Clears the global cap and every per-game override - see `idling::settings::reset`'s doc comment
/// for why this module needs its own full-wipe entry point rather than reusing a whole-struct `set`.
pub async fn reset(app_handle: &AppHandle, steam_id: &str) -> AppResult<()> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &CachedSettings::default())
}

/// The effective cap for `app_id`, in minutes, or `None` if playtime is uncapped. **Per-game wins
/// over global whenever it's set** (`> 0`) - a specific override always takes precedence over the
/// account-wide blanket value, otherwise the account-wide value, otherwise uncapped. Matches
/// `idling::settings::effective_max_idle_time`/`card_farming::manager::is_capped`'s precedence
/// direction. `0` on either means "not set," not "stop immediately."
pub async fn effective_max_playtime(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let cached = {
        let _guard = WRITE_LOCK.lock().await;
        read_unlocked(app_handle, steam_id)?
    };
    if let Some(per_game) = cached
        .per_game_max_playtime
        .get(&app_id)
        .copied()
        .filter(|&v| v > 0)
    {
        return Ok(Some(per_game));
    }
    Ok(Some(cached.global_max_playtime).filter(|&v| v > 0))
}

/// Whether `app_id`'s current total playtime (`playtime_forever_minutes`, in minutes) has already
/// reached its effective cap - the one check shared by every queue-building/start-blocking call
/// site (`auto_idle`/`achievement_unlocker`/`card_farming`'s queue filters,
/// `idling::commands::toggle_manual_idle`'s start guard) so the "is this game over its cap" logic
/// exists in exactly one place. `None`/uncapped always returns `false`.
pub async fn is_over_cap(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    current_playtime_minutes: u64,
) -> AppResult<bool> {
    let cap = effective_max_playtime(app_handle, steam_id, app_id).await?;
    Ok(cap.is_some_and(|minutes| current_playtime_minutes >= u64::from(minutes)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn per_game_wins_when_set_even_if_a_higher_global_value_exists() {
        let cached = CachedSettings {
            global_max_playtime: 600,
            per_game_max_playtime: HashMap::from([(440, 60)]),
        };
        assert_eq!(effective_from(&cached, 440), Some(60));
    }

    #[test]
    fn global_used_when_per_game_is_unset() {
        let cached = CachedSettings {
            global_max_playtime: 600,
            per_game_max_playtime: HashMap::new(),
        };
        assert_eq!(effective_from(&cached, 440), Some(600));
    }

    #[test]
    fn uncapped_when_neither_is_set() {
        let cached = CachedSettings::default();
        assert_eq!(effective_from(&cached, 440), None);
    }

    #[test]
    fn over_cap_true_when_playtime_meets_or_exceeds_the_effective_cap() {
        let cached = CachedSettings {
            global_max_playtime: 0,
            per_game_max_playtime: HashMap::from([(440, 60)]),
        };
        assert!(over_cap_from(&cached, 440, 60));
        assert!(over_cap_from(&cached, 440, 120));
        assert!(!over_cap_from(&cached, 440, 59));
    }

    #[test]
    fn over_cap_false_when_uncapped() {
        let cached = CachedSettings::default();
        assert!(!over_cap_from(&cached, 440, u64::MAX));
    }

    // Mirrors `effective_max_playtime`/`is_over_cap`'s logic without the async file I/O, so it's
    // testable as a pure function - kept private to this test module, same pattern
    // `idling::settings::tests::effective_from` already uses.
    fn effective_from(cached: &CachedSettings, app_id: u32) -> Option<u32> {
        if let Some(per_game) = cached
            .per_game_max_playtime
            .get(&app_id)
            .copied()
            .filter(|&v| v > 0)
        {
            return Some(per_game);
        }
        Some(cached.global_max_playtime).filter(|&v| v > 0)
    }

    fn over_cap_from(cached: &CachedSettings, app_id: u32, current_playtime_minutes: u64) -> bool {
        effective_from(cached, app_id)
            .is_some_and(|minutes| current_playtime_minutes >= u64::from(minutes))
    }
}
