use serde::Serialize;
use tauri::AppHandle;

use crate::credential_store;
use crate::error::{AppError, AppResult};

use super::Settings;

/// The frontend-facing shape of `Settings` - identical wire JSON to what this struct always
/// serialized before the Steam Web API key override moved out to the OS credential store (see
/// `Settings`'s doc comment), thanks to `#[serde(flatten)]`. Every `set_*` command below returns
/// this instead of a bare `Settings` so the settings modal's React state always has a current
/// `steamWebApiKey` value to display, not just the one field that particular command happened to
/// change.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsResponse {
    #[serde(flatten)]
    pub settings: Settings,
    pub steam_web_api_key: Option<String>,
}

pub fn build_response(settings: Settings) -> AppResult<SettingsResponse> {
    let steam_web_api_key = credential_store::load_web_api_key()?;
    Ok(SettingsResponse {
        settings,
        steam_web_api_key,
    })
}

#[tauri::command]
pub fn get_settings(app_handle: AppHandle) -> AppResult<SettingsResponse> {
    super::load(&app_handle)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

/// A well-known, permanently public Steam profile (Steam's own official support account) used
/// purely to exercise `GetPlayerSummaries` - validating a Steam Web API key only needs *a*
/// successful authenticated response, not any particular account's data, so this avoids requiring
/// the caller to resolve the active account's own SteamID64 (which agent-mode accounts may not
/// have yet - see `AppError::AgentSteamIdUnknown`) just to check a key.
const VALIDATION_STEAM_ID: &str = "76561197960265728";

/// Checks whether `api_key` is accepted by the Steam Web API before the frontend persists it.
/// Returns `Ok(false)` for a key Steam rejects (HTTP 403) rather than an `AppError`, since an
/// invalid key is an expected, user-correctable outcome, not a failure of this command itself.
#[tauri::command]
pub async fn validate_steam_web_api_key(api_key: String) -> AppResult<bool> {
    let key = api_key.trim();
    if key.is_empty() {
        return Ok(false);
    }

    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={key}&steamids={VALIDATION_STEAM_ID}"
    );
    let response = reqwest::Client::new()
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?;

    Ok(response.status().is_success())
}

/// Sets or clears the user-supplied Steam Web API key override in the OS credential store (see
/// `credential_store::{save,delete}_web_api_key`) - the frontend is expected to have already
/// validated a non-blank `key` via `validate_steam_web_api_key` before calling this. A
/// blank/whitespace-only `key` clears the override (falls through to the embedded build key via
/// `resolve_api_key`), matching this command's previous "blank explicit key falls through"
/// behavior from when the override still lived in `settings.json`.
#[tauri::command]
pub fn set_steam_web_api_key(app_handle: AppHandle, key: Option<String>) -> AppResult<SettingsResponse> {
    let key = key.map(|k| k.trim().to_string()).filter(|k| !k.is_empty());
    match key {
        Some(k) => credential_store::save_web_api_key(&k)?,
        None => credential_store::delete_web_api_key()?,
    }

    super::load(&app_handle)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_anti_away(app_handle: AppHandle, enabled: bool) -> AppResult<SettingsResponse> {
    super::set_anti_away(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_start_minimized(app_handle: AppHandle, enabled: bool) -> AppResult<SettingsResponse> {
    super::set_start_minimized(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_close_to_tray(app_handle: AppHandle, enabled: bool) -> AppResult<SettingsResponse> {
    super::set_close_to_tray(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_auto_update_games_list(
    app_handle: AppHandle,
    enabled: bool,
) -> AppResult<SettingsResponse> {
    super::set_auto_update_games_list(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_free_game_notifications(
    app_handle: AppHandle,
    enabled: bool,
) -> AppResult<SettingsResponse> {
    super::set_free_game_notifications(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_theme(app_handle: AppHandle, theme: String) -> AppResult<SettingsResponse> {
    super::set_theme(&app_handle, theme)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_font(app_handle: AppHandle, font: String) -> AppResult<SettingsResponse> {
    super::set_font(&app_handle, font)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_disable_tooltips(app_handle: AppHandle, enabled: bool) -> AppResult<SettingsResponse> {
    super::set_disable_tooltips(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_show_recommended_carousel(
    app_handle: AppHandle,
    enabled: bool,
) -> AppResult<SettingsResponse> {
    super::set_show_recommended_carousel(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}

#[tauri::command]
pub fn set_show_recent_carousel(
    app_handle: AppHandle,
    enabled: bool,
) -> AppResult<SettingsResponse> {
    super::set_show_recent_carousel(&app_handle, enabled)
        .map_err(AppError::SettingsIo)
        .and_then(build_response)
}
