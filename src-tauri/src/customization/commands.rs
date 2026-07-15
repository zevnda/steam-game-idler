use std::path::PathBuf;

use tauri::AppHandle;

use crate::error::AppResult;
use crate::settings::Settings;

#[tauri::command]
pub fn set_custom_background(app_handle: AppHandle, path: String) -> AppResult<Settings> {
    super::set_background(&app_handle, PathBuf::from(path))
}

#[tauri::command]
pub fn clear_custom_background(app_handle: AppHandle) -> AppResult<Settings> {
    super::clear_background(&app_handle)
}

#[tauri::command]
pub fn get_custom_background_data_url(app_handle: AppHandle) -> AppResult<Option<String>> {
    super::get_background_data_url(&app_handle)
}
