use base64::Engine;
use lazy_static::lazy_static;
use regex::Regex;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::sync::Mutex;
use std::time::Duration;
use steamlocate::SteamDir;
use sysinfo::{ProcessesToUpdate, System};
use tauri::Emitter;
use tauri::Manager;

lazy_static! {
    static ref LAST_KNOWN_TITLES: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

#[tauri::command]
pub async fn is_dev() -> bool {
    cfg!(debug_assertions)
}

#[tauri::command]
pub async fn is_steam_running() -> bool {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .any(|proc| proc.name().eq_ignore_ascii_case("steam.exe"))
}

#[tauri::command]
pub async fn validate_session(
    sid: String,
    sls: String,
    sma: Option<String>,
    steamid: String,
) -> Result<Value, String> {
    let client = Client::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steamid, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    // Send the request and handle the response
    let response = client
        .get("https://steamcommunity.com/?l=english")
        .header("Content-Type", "application/json")
        .header("Cookie", cookie_value)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;

    let regex = Regex::new(
        r#"<div\s+class="popup_block_new"\s+id="account_dropdown"\s+style="display:\s*none;"#,
    )
    .map_err(|e| e.to_string())?;
    let regex_two = Regex::new(r#"<a\s+href="https://steamcommunity\.com/(id|profiles)/[^"]*"\s+data-miniprofile="\d+">([^<]+)</a>"#)
        .map_err(|e| e.to_string())?;

    // Check if the user is logged in based on the response HTML
    if let Some(_m) = regex.find(&html) {
        if let Some(captures) = regex_two.captures(&html) {
            Ok(json!({ "user": captures[2].to_string() }))
        } else {
            Ok(json!({ "error": "Not logged in" }))
        }
    } else {
        Ok(json!({ "error": "Not logged in" }))
    }
}

#[tauri::command]
pub async fn validate_steam_api_key(
    steam_id: String,
    api_key: Option<String>,
) -> Result<Value, String> {
    // Check if the API key exists
    let api_key = match api_key {
        Some(key) if !key.trim().is_empty() => key,
        _ => return Ok(json!({ "error": "Invalid or missing API key" })),
    };

    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={}&steamids={}",
        api_key, steam_id
    );

    let client = Client::new();

    // Send the request and handle the response
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Value>().await {
                    Ok(body) => Ok(body),
                    Err(_) => Ok(json!({ "error": "Failed to decode API response" })),
                }
            } else {
                Ok(json!({ "error": "Invalid API key or unauthorized request" }))
            }
        }
        Err(_) => Ok(json!({ "error": "Failed to connect to Steam API" })),
    }
}

#[tauri::command]
pub async fn anti_away() -> Result<(), String> {
    // Execute a command to set Steam status to online
    std::process::Command::new("cmd")
        .args(&["/C", "start steam://friends/status/online"])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn open_file_explorer(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let cache_dir = get_cache_dir(&app_handle)?;

    // Open the file explorer and select the specified path
    std::process::Command::new("explorer")
        .args(["/select,", cache_dir.join(path).to_str().unwrap()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_tray_icon(default: bool) -> String {
    let icon_bytes: &[u8] = if default {
        include_bytes!("../icons/32x32.png")
    } else {
        include_bytes!("../icons/32x32_running.png")
    };
    base64::engine::general_purpose::STANDARD.encode(icon_bytes)
}

pub fn get_lib_path() -> Result<String, String> {
    // Get the current executable path
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("libs");
    path.push("SteamUtility.exe");
    Ok(path.to_str().unwrap().to_string())
}

pub async fn get_steam_location() -> Result<String, steamlocate::Error> {
    let steam_dir = SteamDir::locate()?;
    let config_path = steam_dir.path().join("config").join("loginusers.vdf");
    Ok(config_path.display().to_string())
}

#[tauri::command]
pub fn is_portable() -> bool {
    // Always return false in development mode
    if cfg!(debug_assertions) {
        return false;
    }

    if let Ok(current_exe) = tauri::utils::platform::current_exe() {
        let mut installed_flag = current_exe.clone();
        installed_flag.pop();
        installed_flag.push(".installed");
        !installed_flag.exists()
    } else {
        true
    }
}

// Get the cache directory path as a string for frontend use
#[tauri::command]
pub fn get_cache_dir_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    get_cache_dir(&app_handle).map(|path| path.to_string_lossy().to_string())
}

// Get the base cache directory path based on whether the app is running in portable mode.
// In portable mode: returns exe_dir/cache
// In non-portable mode: returns app_data_dir/cache
pub fn get_cache_dir(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    if is_portable() {
        let mut exe_path = tauri::utils::platform::current_exe()
            .map_err(|e| format!("Failed to get current exe path: {}", e))?;
        exe_path.pop(); // Remove the .exe file name to get the directory
        Ok(exe_path.join("cache"))
    } else {
        app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))
            .map(|path| path.join("cache"))
    }
}

// Command to quit the application
#[tauri::command]
pub fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

// Command to set the zoom level of the webview
#[tauri::command]
pub fn set_zoom(webview: tauri::Webview, scale_factor: f64) -> Result<(), String> {
    webview
        .with_webview(move |webview| {
            #[cfg(windows)]
            unsafe {
                if let Err(e) = webview.controller().SetZoomFactor(scale_factor) {
                    eprintln!("Failed to set zoom factor: {}", e);
                }
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Monitor and emit Steam running status changes
#[tauri::command]
pub async fn start_steam_status_monitor(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_status: Option<bool> = None;
        loop {
            let current_status = is_steam_running().await;
            if last_status != Some(current_status) {
                last_status = Some(current_status);
                let _ = app_handle.emit("steam_status_changed", current_status);
            }
            tokio::time::sleep(Duration::from_millis(1000)).await;
        }
    });
}
