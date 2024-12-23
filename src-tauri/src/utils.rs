use regex::Regex;
use reqwest::Client;
use serde_json::Value;
use std::os::windows::io::AsRawHandle;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, Stdio};
use std::sync::{Arc, Mutex};
use winapi::um::processthreadsapi::TerminateProcess;
use winapi::um::winnt::HANDLE;

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
    // Execute the tasklist command to get details of SteamUtility.exe processes
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
    // Filter out game IDs that are not found in the output
    Ok(ids
        .into_iter()
        .filter(|id| !output_str.contains(&format!("[{}]", id)))
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
        .get("https://steamcommunity.com/")
        .header("Content-Type", "application/json")
        .header("Cookie", cookie_value)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;
    let regex = Regex::new(r"Sign out").map_err(|e| e.to_string())?;
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

#[tauri::command]
pub async fn get_file_path() -> Result<PathBuf, String> {
    // Get the current executable path
    match std::env::current_exe() {
        Ok(path) => return Ok(path),
        Err(error) => return Err(format!("{error}")),
    }
}

pub fn kill_processes(spawned_processes: &Arc<Mutex<Vec<Child>>>) {
    let mut processes = spawned_processes.lock().unwrap();
    for child in processes.iter_mut() {
        unsafe {
            // Terminate each process
            let handle = child.as_raw_handle() as HANDLE;
            TerminateProcess(handle, 1);
        }
        let _ = child.wait();
    }
    processes.clear();
    // Exit the application
    std::process::exit(0);
}
