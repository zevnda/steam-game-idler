use lazy_static::lazy_static;
use regex::Regex;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::process::Stdio;
use std::sync::Mutex;
use steamlocate::SteamDir;
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
    // Execute the tasklist command to check if steam.exe is running
    let output = std::process::Command::new("tasklist")
        .args(&["/FI", "IMAGENAME eq steam.exe"])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .creation_flags(0x08000000)
        .output()
        .expect("Failed to execute tasklist command");
    let output_str = String::from_utf8_lossy(&output.stdout);
    // Check if the output contains "steam.exe"
    output_str.contains("steam.exe")
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
    // Get the application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    // Open the file explorer and select the specified path
    std::process::Command::new("explorer")
        .args(["/select,", app_data_dir.join(path).to_str().unwrap()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
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
