use crate::tasks::ProcessInfo;
use lazy_static::lazy_static;
use regex::Regex;
use reqwest::Client;
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::os::windows::io::AsRawHandle;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use steamlocate::SteamDir;
use winapi::um::processthreadsapi::TerminateProcess;
use winapi::um::winnt::HANDLE;

lazy_static! {
    static ref LAST_KNOWN_TITLES: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

#[tauri::command]
pub async fn check_status() -> bool {
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
pub async fn check_process_by_game_id(ids: Vec<String>) -> Result<Vec<String>, String> {
    let output = std::process::Command::new("tasklist")
        .args(&[
            "/V",
            "/FO",
            "CSV",
            "/NH",
            "/FI",
            "IMAGENAME eq SteamUtility.exe",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    let mut last_known_titles = LAST_KNOWN_TITLES.lock().unwrap();
    let mut current_pids = Vec::new();
    let mut found_ids = Vec::new();

    for line in output_str.lines() {
        if line.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 2 {
            let pid = parts[1].trim_matches('"').to_string();
            let title = parts.last().unwrap_or(&"").trim_matches('"');
            current_pids.push(pid.clone());

            // If we have a valid title, update our stored title
            if title != "N/A" {
                last_known_titles.insert(pid.clone(), title.to_string());
            }

            // Use either current title or last known title
            let check_title = if title != "N/A" {
                title
            } else {
                last_known_titles
                    .get(&pid)
                    .map(|s| s.as_str())
                    .unwrap_or("N/A")
            };

            // Check if any of our IDs are in the title
            for id in &ids {
                if check_title.contains(&format!("[{}]", id)) {
                    found_ids.push(id.clone());
                }
            }
        }
    }

    // Clean up any PIDs that are no longer running
    last_known_titles.retain(|pid, _| current_pids.contains(pid));

    // Return IDs that weren't found
    Ok(ids
        .into_iter()
        .filter(|id| !found_ids.contains(id))
        .collect())
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
            Ok(serde_json::json!({ "user": captures[2].to_string() }))
        } else {
            Ok(serde_json::json!({ "error": "Not logged in" }))
        }
    } else {
        Ok(serde_json::json!({ "error": "Not logged in" }))
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

pub fn get_lib_path() -> Result<String, String> {
    // Get the current executable path
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("libs");
    path.push("SteamUtility.exe");
    Ok(path.to_str().unwrap().to_string())
}

pub fn kill_processes(spawned_processes: &Arc<Mutex<Vec<ProcessInfo>>>) {
    if let Ok(mut processes) = spawned_processes.lock() {
        for process in processes.iter_mut() {
            unsafe {
                let handle = process.child.as_raw_handle() as HANDLE;
                TerminateProcess(handle, 1);
            }
        }
        processes.clear();
    }
    std::process::exit(0);
}

pub async fn get_steam_loc() -> Result<String, steamlocate::Error> {
    let steam_dir = SteamDir::locate()?;
    let config_path = steam_dir.path().join("config").join("loginusers.vdf");
    Ok(config_path.display().to_string())
}

pub fn parse_login_users(config_path: &PathBuf) -> Result<HashMap<String, String>, String> {
    let content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let user_regex = Regex::new(r#""(\d{17})"\s*\{[^}]*"PersonaName"\s*"([^"]*)""#)
        .map_err(|e| e.to_string())?;
    let mut users = HashMap::new();

    for cap in user_regex.captures_iter(&content) {
        let steam_id = cap[1].to_string();
        let persona_name = cap[2].to_string();
        users.insert(steam_id, persona_name);
    }

    Ok(users)
}
