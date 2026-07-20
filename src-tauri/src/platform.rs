//! Environment-detection helpers shared across features (portable-mode detection, cache/log
//! directory resolution) rather than owned by any single module.

use std::path::PathBuf;

use tauri::Manager;

use crate::error::{AppError, AppResult};

/// Always `false` in debug builds; in release, `false` only when a `.installed` marker file sits
/// next to the executable (written by the NSIS installer, absent from the portable zip) - a
/// Windows-only concept. Linux has no "extract and run anywhere" equivalent: an AppImage's
/// squashfs mount is read-only at runtime, and deb/rpm install to `/usr/bin`, which a regular user
/// can't write to either. Every Linux release build uses `app_data_dir()` instead.
#[tauri::command]
pub fn is_portable() -> bool {
    if cfg!(debug_assertions) {
        return false;
    }

    #[cfg(windows)]
    {
        match tauri::utils::platform::current_exe() {
            Ok(mut exe_path) => {
                exe_path.pop();
                exe_path.push(".installed");
                !exe_path.exists()
            }
            Err(_) => true,
        }
    }

    #[cfg(not(windows))]
    {
        false
    }
}

/// Whether this is a debug build - gates the SteamWarning modal so a dev machine without Steam
/// running doesn't get nagged. Compile-time constant, unlike `is_portable`'s runtime check.
#[tauri::command]
pub fn is_dev() -> bool {
    cfg!(debug_assertions)
}

/// Whether this build can self-update via the Tauri updater plugin - distinct from `is_portable()`
/// (which governs where data is stored, not whether an update can install). The two always agree
/// on Windows (a portable zip has no installer to invoke; an installed exe does), but diverge on
/// Linux: every packaging format uses `app_data_dir()`, yet only an AppImage can self-update,
/// since Tauri's Linux updater replaces the running AppImage file in place - not possible for a
/// deb/rpm install, whose binary lives in `/usr/bin`, owned by the system package manager.
/// Detected via the `APPIMAGE` env var, which every AppImage runtime sets unconditionally.
#[tauri::command]
pub fn can_auto_update() -> bool {
    #[cfg(windows)]
    {
        !is_portable()
    }

    #[cfg(not(windows))]
    {
        cfg!(debug_assertions) || std::env::var_os("APPIMAGE").is_some()
    }
}

/// The running OS, as `"windows"`/`"linux"` (i.e. `std::env::consts::OS` verbatim) - lets the
/// frontend gate CLI-mode sign-in (Windows-only; requires a real local Steam client) and the 5
/// Game Coordinator titles (unsupported via the daemon path on both OSes, but Windows has CLI
/// mode as a fallback and Linux doesn't) without a separate capability-flag command per feature.
#[tauri::command]
pub fn current_os() -> &'static str {
    std::env::consts::OS
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
