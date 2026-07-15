use std::fs;
use std::path::PathBuf;

use serde::Serialize;
use tauri::{AppHandle, State};

use crate::achievement_unlocker::settings::AchievementUnlockerSettings;
use crate::card_farming::settings::CardFarmingSettings;
use crate::error::{AppError, AppResult};
use crate::free_games::settings::FreeGamesSettings;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::inventory::settings::InventorySettings;
use crate::logging;
use crate::platform;
use crate::settings::{self, commands::SettingsResponse};
use crate::steam_agent::AgentManager;

/// `tracing_appender::rolling::daily` names files by prefix + rotation date, so there's no fixed
/// filename to construct - the current file is whichever one in the log directory was written to
/// most recently. Scanning by mtime rather than reconstructing the date-suffix naming scheme keeps
/// this correct even if that scheme changes (e.g. `logging::init` switches rotation frequency).
fn current_log_file(app_handle: &AppHandle) -> AppResult<PathBuf> {
    let dir = logging::log_dir(app_handle).map_err(|e| AppError::LogIo(e.to_string()))?;

    fs::read_dir(&dir)
        .map_err(|e| AppError::LogIo(e.to_string()))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_file())
        .max_by_key(|entry| {
            entry
                .metadata()
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        })
        .map(|entry| entry.path())
        .ok_or_else(|| AppError::LogIo("no log file found yet".to_string()))
}

/// The current log file's path, for `revealItemInDir` (the frontend calls that directly via
/// `@tauri-apps/plugin-opener` - no Rust command wraps it, path resolution is all that's needed
/// here).
#[tauri::command]
pub fn get_log_file_path(app_handle: AppHandle) -> AppResult<String> {
    Ok(current_log_file(&app_handle)?.to_string_lossy().to_string())
}

/// `settings.json`'s path, for the same `revealItemInDir` use as above. Creates the file with
/// defaults first if this is a fresh install and it doesn't exist yet - `revealItemInDir` can't
/// select a path that isn't there.
#[tauri::command]
pub fn get_settings_file_path(app_handle: AppHandle) -> AppResult<String> {
    let path = settings::settings_path(&app_handle).map_err(AppError::SettingsIo)?;
    if !path.exists() {
        let current = settings::load(&app_handle).map_err(AppError::SettingsIo)?;
        settings::save(&app_handle, &current).map_err(AppError::SettingsIo)?;
    }
    Ok(path.to_string_lossy().to_string())
}

/// The current log file's most recent lines, newest first (matching `main`'s log viewer order),
/// capped at `limit`. Raw formatted `tracing` lines, not split into a timestamp/message pair the
/// way `main`'s hand-rolled `log.txt` was - `tracing`'s own line format isn't a simple " + "
/// delimiter, so the frontend renders each line as-is instead of forcing a re-parse.
#[tauri::command]
pub fn get_log_lines(app_handle: AppHandle, limit: usize) -> AppResult<Vec<String>> {
    let path = current_log_file(&app_handle)?;
    let contents = fs::read_to_string(&path).map_err(|e| AppError::LogIo(e.to_string()))?;

    let mut lines: Vec<String> = contents
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(str::to_string)
        .collect();
    lines.reverse();
    lines.truncate(limit);
    Ok(lines)
}

/// Truncates the current log file to empty. Safe to do from a second handle while `logging::init`'s
/// non-blocking writer keeps its own handle open: that writer opens its file in append mode, and
/// append-mode writes always target the current end-of-file rather than a cached cursor position,
/// so truncating here doesn't leave a stale-offset gap of null bytes once logging resumes.
#[tauri::command]
pub fn clear_log_file(app_handle: AppHandle) -> AppResult<()> {
    let path = current_log_file(&app_handle)?;
    let file = fs::OpenOptions::new()
        .write(true)
        .open(&path)
        .map_err(|e| AppError::LogIo(e.to_string()))?;
    file.set_len(0)
        .map_err(|e| AppError::LogIo(e.to_string()))?;
    Ok(())
}

/// Wipes the entire on-disk cache directory (every account's cached games list, achievements,
/// inventory, card-farming queue/blacklist, favorites, auto-idle state, app-wide settings.json,
/// etc. - everything `platform::cache_dir` roots) in one shot. Mirrors `main`'s
/// `delete_all_cache_files` for the Debug tab's "Clear Data" action - a not-yet-existing directory
/// (fresh install, or already cleared) is not an error. Logs live under `platform::logs_dir`, a
/// separate sibling directory, so this can't race the open log file handle `logging::init` holds.
#[tauri::command]
pub fn clear_all_cache_files(app_handle: AppHandle) -> AppResult<()> {
    let dir = platform::cache_dir(&app_handle)?;
    match fs::remove_dir_all(&dir) {
        Ok(()) => {
            tracing::info!(path = %dir.display(), "debug: cleared cache directory");
            Ok(())
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(AppError::CacheClearIo(e.to_string())),
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub os_version: String,
    pub arch: String,
}

/// Basic OS/architecture info for the settings export - built on `sysinfo` (already a dependency
/// for other features) rather than pulling in `tauri-plugin-os` for two string lookups.
#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os_version: sysinfo::System::long_os_version().unwrap_or_else(|| "Windows".to_string()),
        arch: std::env::consts::ARCH.to_string(),
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetSettingsResult {
    pub settings: SettingsResponse,
    /// `None` when `account` wasn't provided (nothing signed in) - the caller's own settings tab
    /// state simply doesn't get touched in that case.
    pub achievement_unlocker_settings: Option<AchievementUnlockerSettings>,
    pub inventory_settings: Option<InventorySettings>,
    pub card_farming_settings: Option<CardFarmingSettings>,
    pub free_games_settings: Option<FreeGamesSettings>,
}

/// Resets every app-wide setting (`settings.json` via `settings::reset`, the Steam Web API key
/// override, and the custom background image file) plus - if `account` is signed in - that
/// account's achievement-unlocker, inventory-manager, card-farming, and free-games settings, all
/// back to their defaults. Deliberately does **not** touch `agent_accounts` (the saved-session
/// roster) - that's authentication state, not a user preference; a reset should never sign the
/// user out. Also deliberately does not clear a CLI-mode
/// account's persisted free-games store-webview session (`local_steam::free_game_claim`'s cookie
/// jar) - that's a separate sign-in concern from the `auto_redeem` preference this resets, with its
/// own explicit "Sign out" action in the free-games settings tab.
#[tauri::command]
pub async fn reset_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: Option<GamesAccount>,
) -> AppResult<ResetSettingsResult> {
    let had_account = account.is_some();

    crate::credential_store::delete_web_api_key().map_err(|e| {
        tracing::warn!(error = %e, "settings reset: failed to clear Steam Web API key");
        e
    })?;

    // Best-effort: removes the background image file itself (settings::reset below zeroes the
    // `custom_background` filename regardless, so a failure here only leaves an orphaned file, not
    // a broken reset).
    if let Err(e) = crate::customization::clear_background(&app_handle) {
        tracing::warn!(error = %e, "settings reset: failed to clear custom background image");
    }

    let settings = settings::reset(&app_handle)
        .map_err(AppError::SettingsIo)
        .and_then(settings::commands::build_response)
        .map_err(|e| {
            tracing::warn!(error = %e, "settings reset: failed to reset app-wide settings");
            e
        })?;

    let (
        achievement_unlocker_settings,
        inventory_settings,
        card_farming_settings,
        free_games_settings,
    ) = match account {
        Some(account) => {
            let steam_id = resolve_steam_id(&account, &agent_manager).await?;
            // `reset` (not `set`) for achievement-unlocker/card-farming - `set` deliberately only
            // touches `.settings` on their own writes, leaving per-game overrides/caps alone (see
            // each module's doc comment), so a full reset needs the dedicated wipe entry point or
            // those overrides would silently survive. `inventory`/`free_games` have no per-game
            // state, so their existing whole-struct `set` is already a full reset.
            let achievement_unlocker =
                crate::achievement_unlocker::settings::reset(&app_handle, &steam_id)
                    .await
                    .map_err(|e| {
                        tracing::warn!(steam_id, error = %e, "settings reset: failed to reset achievement unlocker settings");
                        e
                    })?;
            let inventory = crate::inventory::settings::set(
                &app_handle,
                &steam_id,
                InventorySettings::default(),
            )
            .await
            .map_err(|e| {
                tracing::warn!(steam_id, error = %e, "settings reset: failed to reset inventory settings");
                e
            })?;
            let card_farming = crate::card_farming::settings::reset(&app_handle, &steam_id)
                .await
                .map_err(|e| {
                    tracing::warn!(steam_id, error = %e, "settings reset: failed to reset card farming settings");
                    e
                })?;
            let free_games = crate::free_games::settings::set(
                &app_handle,
                &steam_id,
                FreeGamesSettings::default(),
            )
            .await
            .map_err(|e| {
                tracing::warn!(steam_id, error = %e, "settings reset: failed to reset free games settings");
                e
            })?;
            // Neither module has a whole-struct settings surface (see each module's doc comment for
            // why) - `reset` wipes the global cap + every per-game override in one write.
            crate::idling::settings::reset(&app_handle, &steam_id)
                .await
                .map_err(|e| {
                    tracing::warn!(steam_id, error = %e, "settings reset: failed to reset idling max idle time settings");
                    e
                })?;
            crate::max_playtime::settings::reset(&app_handle, &steam_id)
                .await
                .map_err(|e| {
                    tracing::warn!(steam_id, error = %e, "settings reset: failed to reset max playtime settings");
                    e
                })?;
            (
                Some(achievement_unlocker),
                Some(inventory),
                Some(card_farming),
                Some(free_games),
            )
        }
        None => (None, None, None, None),
    };

    tracing::info!(had_account, "settings reset: completed");

    Ok(ResetSettingsResult {
        settings,
        achievement_unlocker_settings,
        inventory_settings,
        card_farming_settings,
        free_games_settings,
    })
}
