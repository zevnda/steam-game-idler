//! Environment-detection helpers shared across features (portable-mode detection, cache/log
//! directory resolution) rather than owned by any single module.

use std::path::PathBuf;

use tauri::Manager;

use crate::error::{AppError, AppResult};

/// Always `false` in debug builds; in release, `false` only when a `.installed` marker file sits
/// next to the executable (written by the NSIS installer, absent from the portable zip).
#[tauri::command]
pub fn is_portable() -> bool {
    if cfg!(debug_assertions) {
        return false;
    }

    match tauri::utils::platform::current_exe() {
        Ok(mut exe_path) => {
            exe_path.pop();
            exe_path.push(".installed");
            !exe_path.exists()
        }
        Err(_) => true,
    }
}

/// Whether this is a debug build - gates the SteamWarning modal so a dev machine without Steam
/// running doesn't get nagged. Compile-time constant, unlike `is_portable`'s runtime check.
#[tauri::command]
pub fn is_dev() -> bool {
    cfg!(debug_assertions)
}

/// Portable-aware base directory every per-install file is rooted under: `<exe_dir>` in portable
/// mode, `<app_data_dir>` otherwise. Shared by `cache_dir`/`logs_dir` to avoid duplicating the branch.
fn base_dir(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    if is_portable() {
        let mut exe_path = tauri::utils::platform::current_exe()
            .map_err(|e| AppError::PathResolution(e.to_string()))?;
        exe_path.pop();
        Ok(exe_path)
    } else {
        app_handle
            .path()
            .app_data_dir()
            .map_err(|e| AppError::PathResolution(e.to_string()))
    }
}

/// The base cache directory: `<exe_dir>/cache` in portable mode, `<app_data_dir>/cache` otherwise.
/// Also holds `settings.json` and per-account data, not just disposable cache -
/// `debug::commands::clear_all_cache_files` wiping it reflects that. Callers create the directory
/// themselves if they're about to write into it - this only resolves the path.
pub fn cache_dir(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    base_dir(app_handle).map(|dir| dir.join("cache"))
}

/// The log directory: `<exe_dir>/logs` in portable mode, `<app_data_dir>/logs` otherwise -
/// deliberately a sibling of `cache_dir`, not nested inside it, so cache clearing never races
/// the logger's permanently-open file handle.
pub fn logs_dir(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    base_dir(app_handle).map(|dir| dir.join("logs"))
}
