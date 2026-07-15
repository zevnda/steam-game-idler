//! Custom-background image storage. Deliberately *not* stored as a base64 blob inside
//! `settings.json` (as `main` does - confirmed by reading `main`'s `handleBackgroundChange.ts`) -
//! that bloats every settings read/write with however large the picked image is. Instead the file
//! itself is copied into its own directory under the app data dir, and `settings.json` only ever
//! stores the filename (`Settings::custom_background`) via `settings::set_custom_background`.

pub mod commands;

use std::path::PathBuf;

use base64::Engine;

use crate::error::{AppError, AppResult};
use crate::settings::{self, Settings};

const CUSTOMIZATION_DIR_NAME: &str = "customization";
const BACKGROUND_FILE_STEM: &str = "background";

/// 10 MB - generous for a background image while still ruling out something absurd being copied
/// into app data and re-read on every launch.
const MAX_BACKGROUND_BYTES: u64 = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp", "gif"];

/// Routed through `platform::cache_dir` (portable-aware) rather than `app_data_dir()` directly -
/// the latter would leave background images behind in `%APPDATA%` for a portable install.
fn customization_dir(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    Ok(crate::platform::cache_dir(app_handle)?.join(CUSTOMIZATION_DIR_NAME))
}

/// Removes any existing `background.*` file in the customization dir, regardless of extension -
/// called before writing a new one (the user's new pick may have a different extension than their
/// last one) and by `clear_background`. Not an error if none exists yet.
fn remove_existing_background(dir: &std::path::Path) -> AppResult<()> {
    if !dir.exists() {
        return Ok(());
    }
    let entries = std::fs::read_dir(dir).map_err(|e| {
        AppError::CustomBackgroundIo(format!("failed to read {}: {e}", dir.display()))
    })?;
    for entry in entries.flatten() {
        let path = entry.path();
        let is_background_file = path
            .file_stem()
            .and_then(|s| s.to_str())
            .is_some_and(|stem| stem == BACKGROUND_FILE_STEM);
        if is_background_file {
            std::fs::remove_file(&path).map_err(|e| {
                AppError::CustomBackgroundIo(format!("failed to remove {}: {e}", path.display()))
            })?;
        }
    }
    Ok(())
}

/// Validates, copies, and persists a new custom background image. `source_path` is a path the
/// frontend obtained from `@tauri-apps/plugin-dialog`'s file picker - never user-typed, but still
/// validated defensively (extension allow-list + size cap) since it names a real file this process
/// will read and copy. Plain sync `fn`, not `async` - every operation here is synchronous
/// `std::fs` I/O with no real `.await` point, so marking it `async` would just run that blocking
/// work straight through on whatever tokio worker thread polls it instead of Tauri's own
/// blocking-pool dispatch for sync commands (see `commands.rs`'s `set_custom_background` for where
/// that dispatch actually happens).
pub fn set_background(app_handle: &tauri::AppHandle, source_path: PathBuf) -> AppResult<Settings> {
    let extension = match source_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .filter(|e| ALLOWED_EXTENSIONS.contains(&e.as_str()))
    {
        Some(extension) => extension,
        None => {
            tracing::warn!(
                path = %source_path.display(),
                "customization: rejected background image - unsupported extension"
            );
            return Err(AppError::CustomBackgroundInvalid(format!(
                "unsupported image extension for {}",
                source_path.display()
            )));
        }
    };

    let metadata = std::fs::metadata(&source_path).map_err(|e| {
        AppError::CustomBackgroundIo(format!("failed to read {}: {e}", source_path.display()))
    })?;
    if metadata.len() > MAX_BACKGROUND_BYTES {
        tracing::warn!(
            path = %source_path.display(),
            size_bytes = metadata.len(),
            "customization: rejected background image - exceeds size limit"
        );
        return Err(AppError::CustomBackgroundInvalid(format!(
            "{} exceeds the {} MB background image size limit",
            source_path.display(),
            MAX_BACKGROUND_BYTES / (1024 * 1024)
        )));
    }

    let dir = customization_dir(app_handle)?;
    std::fs::create_dir_all(&dir).map_err(|e| {
        AppError::CustomBackgroundIo(format!("failed to create {}: {e}", dir.display()))
    })?;
    remove_existing_background(&dir)?;

    let filename = format!("{BACKGROUND_FILE_STEM}.{extension}");
    let dest_path = dir.join(&filename);
    std::fs::copy(&source_path, &dest_path).map_err(|e| {
        tracing::warn!(
            source = %source_path.display(),
            dest = %dest_path.display(),
            error = %e,
            "customization: failed to copy background image"
        );
        AppError::CustomBackgroundIo(format!(
            "failed to copy {} to {}: {e}",
            source_path.display(),
            dest_path.display()
        ))
    })?;

    let result = settings::set_custom_background(app_handle, Some(filename)).map_err(AppError::SettingsIo);
    if result.is_ok() {
        tracing::info!("customization: background image saved");
    }
    result
}

/// Removes the stored background file (if any) and clears `Settings::custom_background`.
pub fn clear_background(app_handle: &tauri::AppHandle) -> AppResult<Settings> {
    let dir = customization_dir(app_handle)?;
    remove_existing_background(&dir)?;
    let result = settings::set_custom_background(app_handle, None).map_err(AppError::SettingsIo);
    if result.is_ok() {
        tracing::info!("customization: background image cleared");
    }
    result
}

fn mime_for_extension(extension: &str) -> &'static str {
    match extension {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    }
}

/// Reads the currently-stored background image (if any) and returns it as a `data:` URI. Read on
/// demand rather than exposed via a static asset-protocol URL - avoids widening this app's asset-
/// protocol scope just for one feature, and the image is only ever needed by a Casual-tier
/// account's `CustomBackground` component, not on every settings load.
pub fn get_background_data_url(app_handle: &tauri::AppHandle) -> AppResult<Option<String>> {
    let settings = settings::load(app_handle).map_err(AppError::SettingsIo)?;
    let Some(filename) = settings.custom_background else {
        return Ok(None);
    };

    let path = customization_dir(app_handle)?.join(&filename);
    let bytes = std::fs::read(&path).map_err(|e| {
        AppError::CustomBackgroundIo(format!("failed to read {}: {e}", path.display()))
    })?;

    let extension = std::path::Path::new(&filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(Some(format!(
        "data:{};base64,{}",
        mime_for_extension(extension),
        encoded
    )))
}
