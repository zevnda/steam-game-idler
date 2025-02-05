use crate::utils::{get_lib_path, get_steam_loc, parse_login_users};
use serde_json;
use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Child;
use std::sync::{Arc, Mutex};

lazy_static::lazy_static! {
    pub static ref SPAWNED_PROCESSES: Arc<Mutex<Vec<Child>>> = Arc::new(Mutex::new(Vec::new()));
}

#[tauri::command]
// Get Steam users
pub async fn get_users() -> Result<String, String> {
    let steam_loc = get_steam_loc().await.map_err(|e| e.to_string())?;
    let steam_loc_path = PathBuf::from(steam_loc);

    // Parse the loginusers.vdf file
    match parse_login_users(&steam_loc_path) {
        Ok(users) => {
            if !users.is_empty() {
                // Create a list of users with personaName and steamId
                let user_list: Vec<HashMap<&str, &str>> = users
                    .iter()
                    .map(|(key, value)| {
                        let mut user = HashMap::new();
                        user.insert("personaName", value.as_str());
                        user.insert("steamId", key.as_str());
                        user
                    })
                    .collect();

                // Convert the user list to JSON and return it
                let users_json = serde_json::to_string(&user_list).map_err(|e| e.to_string())?;
                return Ok(users_json);
            }
            Err("No users found".to_string())
        }
        Err(e) => Err(format!("Error parsing loginusers file: {}", e)),
    }
}

#[tauri::command]
// Start idling a game
pub async fn start_idle(app_id: u32, quiet: bool) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let child = std::process::Command::new(exe_path)
        .args(&["idle", &app_id.to_string(), &quiet.to_string()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;

    SPAWNED_PROCESSES.lock().unwrap().push(child);

    std::thread::sleep(std::time::Duration::from_millis(1000));

    let mut processes = SPAWNED_PROCESSES.lock().unwrap();
    if let Some(last_child) = processes.last_mut() {
        match last_child.try_wait() {
            Ok(Some(_)) => return Ok("{\"error\": \"Failed to idle game\"}".to_string()),
            Ok(None) => Ok("{\"success\": \"Successfully idled game\"}".to_string()),
            Err(e) => return Err(e.to_string()),
        }
    } else {
        Ok("{\"error\": \"No process found\"}".to_string())
    }
}

#[tauri::command]
// Stop idling a game by killing its process
pub async fn stop_idle(app_id: u32) -> Result<(), String> {
    let wmic_output = std::process::Command::new("wmic")
        .args(&["process", "get", "processid,commandline"])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to get process");
    let wmic_stdout = String::from_utf8_lossy(&wmic_output.stdout);
    let pid = wmic_stdout
        .lines()
        .find(|line| line.contains(&app_id.to_string()))
        .and_then(|line| line.split_whitespace().last())
        .ok_or_else(|| "No matching process found".to_string())?;
    std::process::Command::new("taskkill")
        .args(&["/F", "/PID", pid])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to kill process");
    Ok(())
}

#[tauri::command]
// Unlock an achievement
pub async fn unlock_achievement(app_id: u32, achievement_id: &str) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["unlock_achievement", &app_id.to_string(), achievement_id])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    println!("{}", output_str);
    Ok(output_str.to_string())
}

#[tauri::command]
// Lock an achievement
pub async fn lock_achievement(app_id: u32, achievement_id: &str) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["lock_achievement", &app_id.to_string(), achievement_id])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(output_str.to_string())
}

#[tauri::command]
// Unlock an achievement
pub async fn toggle_achievement(app_id: u32, achievement_id: &str) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["toggle_achievement", &app_id.to_string(), achievement_id])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(output_str.to_string())
}

#[tauri::command]
// Unlock all achievements
pub async fn unlock_all_achievements(app_id: u32) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["unlock_all_achievements", &app_id.to_string()])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(output_str.to_string())
}

#[tauri::command]
// Lock all achievements
pub async fn lock_all_achievements(app_id: u32) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["lock_all_achievements", &app_id.to_string()])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(output_str.to_string())
}

#[tauri::command]
// Update achievement statistic
pub async fn update_stats(app_id: u32, stats_arr: &str) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["update_stats", &app_id.to_string(), stats_arr])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute stat updater");

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(output_str.to_string())
}

#[tauri::command]
// Reset all achievement statistics
pub async fn reset_all_stats(app_id: u32) -> Result<String, String> {
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["reset_all_stats", &app_id.to_string()])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute stat updater");

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(output_str.to_string())
}
