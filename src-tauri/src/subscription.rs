//! Two small commands the frontend's Pro/subscription-tier check needs - the tier check itself (a
//! live external API call) stays frontend-only since there's no Steam-specific logic involved.
//! Rust only provides what the frontend can't get itself: a stable per-device identifier, and a
//! way to force-quit when a subscription check reports the license as revoked.

use crate::error::{AppError, AppResult};

/// A stable identifier for this machine, sent to the subscription API so a license key can be
/// tied to a device rather than just a Steam account - must stay stable across app versions for
/// existing subscribers.
#[tauri::command]
pub fn get_device_fingerprint() -> AppResult<String> {
    machine_uid::get().map_err(|e| AppError::DeviceFingerprint(e.to_string()))
}

/// Force-quits the app - used when a subscription check reports the license as revoked.
#[tauri::command]
pub fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}
