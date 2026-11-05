//! One-time cleanup for a user upgrading from any pre-6.0.0 release, run at app startup before the
//! window/webview ever loads (see `lib.rs`'s `setup()`). Old and new versions resolve to the same
//! on-disk cache directory and WebView2 profile, so a pre-6.0.0-shaped file left there can crash a
//! v6 command expecting the new shape (e.g. `inventory.json`'s renamed `card_data` -> `items` key).
//!
//! Gated by a marker file rather than a version comparison: a fresh install and a real upgrade
//! both take the same path, and both are safe since wiping an already-empty/already-new-shaped
//! cache directory is a no-op. This also self-heals a user who launches v6.0.0 without going
//! through the in-app updater at all (manual installer, portable zip). The frontend's matching
//! storage clear can't rely on this marker alone, since every copy of the app shares one WebView2
//! profile while each portable folder has its own cache directory - see `PRE_V6_ONLY_KEYS` in
//! `src/shared/utils/update.ts`.

use std::fs;

use crate::debug;
use crate::error::AppResult;

const MARKER_FILE_NAME: &str = ".legacy_migration_complete";

/// Whether `run()` performed the migration *this launch* - the marker file alone can't answer
/// that, since by the time the frontend queries it via `was_legacy_migration_performed`, `run()`
/// (called from `setup()`, before the webview loads) has already written it. The frontend's own
/// one-time `localStorage`/`sessionStorage` clear (`useLegacyMigrationCleanup.ts`) reads this once
/// on mount to decide whether to fire.
pub struct LegacyMigrationState(pub bool);

/// Deliberately inside `platform::cache_dir` (not `app_data_dir()` directly) so a portable
/// install's marker travels with the same folder `clear_all_cache_files` wipes. `run()` always
/// clears the cache dir (recreating it) before writing this marker back in, so ordering is safe.
fn marker_path(app_handle: &tauri::AppHandle) -> AppResult<std::path::PathBuf> {
    Ok(crate::platform::cache_dir(app_handle)?.join(MARKER_FILE_NAME))
}

/// Returns `true` if the migration ran (and, best-effort, completed) this launch. A failure at any
/// step is logged and treated as "try again next launch" rather than aborting startup - `setup()`
/// returning `Err` would abort the whole app launch, which a locked cache file has no business
/// doing.
pub fn run(app_handle: &tauri::AppHandle) -> bool {
    let marker = match marker_path(app_handle) {
        Ok(path) => path,
        Err(e) => {
            tracing::warn!(error = %e, "legacy_migration: could not resolve marker path, skipping");
            return false;
        }
    };

    if marker.exists() {
        return false;
    }

    // Same wipe as the Debug tab's "Clear Data" - same directory, same semantics (not-yet-existing
    // is not an error).
    if let Err(e) = debug::commands::remove_cache_dir(app_handle) {
        tracing::warn!(error = %e, "legacy_migration: cache clear failed, will retry next launch");
        return false;
    }
    tracing::info!("legacy_migration: cleared pre-6.0.0 cache directory (or none was present)");

    // A failure here is logged inside - the cache clear above still happened, so the frontend's
    // localStorage clear should still fire this run even though the *next* run will redundantly
    // retry the (now-empty) cache.
    if write_marker(&marker) {
        tracing::info!("legacy_migration: marker written, migration complete");
    }

    true
}

/// Puts the marker back after the Debug tab's "Clear Data" removes the cache directory it lives in.
/// Without it the next launch would count as a migration and wipe the cache a second time, taking
/// whatever the user set up since clearing (settings, per-account files) with it.
pub fn restore_marker(app_handle: &tauri::AppHandle) {
    match marker_path(app_handle) {
        Ok(marker) => {
            write_marker(&marker);
        }
        Err(e) => tracing::warn!(error = %e, "legacy_migration: could not resolve marker path"),
    }
}

/// Returns whether the marker was written.
fn write_marker(marker: &std::path::Path) -> bool {
    if let Some(parent) = marker.parent() {
        let _ = fs::create_dir_all(parent);
    }
    match fs::write(marker, env!("CARGO_PKG_VERSION")) {
        Ok(()) => true,
        Err(e) => {
            tracing::warn!(error = %e, "legacy_migration: failed to write marker, will retry next launch");
            false
        }
    }
}

#[tauri::command]
pub fn was_legacy_migration_performed(state: tauri::State<'_, LegacyMigrationState>) -> bool {
    state.0
}
