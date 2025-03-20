use crate::utils::{get_lib_path, get_steam_loc, parse_login_users};
use serde_json;
use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::time::Duration;

#[derive(Debug)]
pub struct ProcessInfo {
    pub child: Child,
    pub app_id: u32,
    pub pid: u32,
}

lazy_static::lazy_static! {
    pub static ref SPAWNED_PROCESSES: Arc<Mutex<Vec<ProcessInfo>>> = Arc::new(Mutex::new(Vec::new()));
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

    cleanup_dead_processes().map_err(|e| e.to_string())?;

    let child = Command::new(exe_path)
        .args(&["idle", &app_id.to_string(), &quiet.to_string()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;

    let pid = child.id();

    {
        let mut processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
        processes.push(ProcessInfo { child, app_id, pid });
    }

    tokio::time::sleep(Duration::from_millis(1000)).await;

    let mut processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
    if let Some(process) = processes.last_mut() {
        match process.child.try_wait() {
            Ok(Some(_)) => Ok("{\"error\": \"Failed to idle game\"}".to_string()),
            Ok(None) => Ok("{\"success\": \"Successfully idled game\"}".to_string()),
            Err(e) => Err(e.to_string()),
        }
    } else {
        Ok("{\"error\": \"No process found\"}".to_string())
    }
}

#[tauri::command]
// Stop idling a game by killing its process
pub async fn stop_idle(app_id: u32) -> Result<(), String> {
    let pid = {
        let processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
        processes.iter().find(|p| p.app_id == app_id).map(|p| p.pid)
    }
    .ok_or_else(|| "No matching process found".to_string())?;

    let mut child = std::process::Command::new("taskkill")
        .args(&["/F", "/PID", &pid.to_string()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;

    child.wait().map_err(|e| e.to_string())?;

    if let Ok(mut processes) = SPAWNED_PROCESSES.lock() {
        processes.retain(|p| p.app_id != app_id);
    }

    Ok(())
}

#[tauri::command]
// Start idling multiple games
pub async fn start_farm_idle(app_ids: Vec<u32>) -> Result<String, String> {
    let exe_path = get_lib_path()?;

    cleanup_dead_processes().map_err(|e| e.to_string())?;

    for app_id in app_ids {
        let child = Command::new(&exe_path)
            .args(&["idle", &app_id.to_string(), true.to_string().as_str()])
            .creation_flags(0x08000000)
            .spawn()
            .map_err(|e| e.to_string())?;

        let pid = child.id();

        {
            let mut processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
            processes.push(ProcessInfo { child, app_id, pid });
        }
    }

    Ok("{\"success\": \"Successfully started idling games\"}".to_string())
}

#[tauri::command]
// Stop idling all games by killing their processes
pub async fn stop_farm_idle() -> Result<(), String> {
    let pids: Vec<u32> = {
        let processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
        processes.iter().map(|p| p.pid).collect()
    };

    if !pids.is_empty() {
        let mut command = std::process::Command::new("taskkill");
        command.arg("/F");

        for pid in &pids {
            command.arg("/PID");
            command.arg(pid.to_string());
        }

        let output = command
            .creation_flags(0x08000000)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let error_message = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to kill processes: {}", error_message));
        }
    }

    if let Ok(mut processes) = SPAWNED_PROCESSES.lock() {
        processes.clear();
    }

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

#[tauri::command]
// Get all running processes
pub async fn get_running_processes() -> Result<String, String> {
    let output = std::process::Command::new("tasklist")
        .args(&[
            "/V",
            "/FO",
            "CSV",
            "/NH",
            "/FI",
            "IMAGENAME eq SteamUtility.exe",
        ])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;

    let mut processes = Vec::new();

    for line in output_str.lines() {
        if line.is_empty() {
            continue;
        }

        let mut fields = Vec::new();
        let mut current_field = String::new();
        let mut in_quotes = false;

        for c in line.chars() {
            match c {
                '"' => in_quotes = !in_quotes,
                ',' if !in_quotes => {
                    fields.push(current_field.clone());
                    current_field.clear();
                }
                _ => current_field.push(c),
            }
        }

        if !current_field.is_empty() {
            fields.push(current_field);
        }

        if fields.len() < 9 {
            continue;
        }

        let pid_str = fields[1].trim_matches('"');

        let window_title = fields[fields.len() - 1].trim_matches('"');

        let (game_name, app_id) = if let Some(start) = window_title.find('[') {
            if let Some(end) = window_title[start..].find(']') {
                let app_id_str = &window_title[start + 1..start + end];
                let name = window_title[..start].trim().trim_end_matches(" -");
                (name.to_string(), app_id_str.parse::<u32>().unwrap_or(0))
            } else {
                ("".to_string(), 0)
            }
        } else {
            ("".to_string(), 0)
        };

        if app_id > 0 {
            if let Ok(pid) = pid_str.parse::<u32>() {
                processes.push(serde_json::json!({
                    "appid": app_id,
                    "pid": pid,
                    "name": game_name,
                }));
            }
        }
    }

    let result = serde_json::to_string(&processes).map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
// Kill a process by its PID
pub async fn kill_process_by_pid(pid: u32) -> Result<String, String> {
    cleanup_dead_processes().map_err(|e| e.to_string())?;

    let output = std::process::Command::new("taskkill")
        .args(&["/F", "/PID", &pid.to_string()])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!(
            "{{\"success\": \"Successfully killed process with PID {}\"}}",
            pid
        ))
    } else {
        let error_message = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to kill process: {}", error_message))
    }
}

#[tauri::command]
// Kill all SteamUtility.exe processes
pub async fn kill_all_steamutil_processes() -> Result<String, String> {
    cleanup_dead_processes().map_err(|e| e.to_string())?;

    let output = std::process::Command::new("tasklist")
        .args(&[
            "/V",
            "/FO",
            "CSV",
            "/NH",
            "/FI",
            "IMAGENAME eq SteamUtility.exe",
        ])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut killed_count = 0;
    let mut failed_pids = Vec::new();

    for line in output_str.lines() {
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 2 {
            let pid_str = parts[1].trim_matches('"');
            if let Ok(pid) = pid_str.parse::<u32>() {
                let kill_output = std::process::Command::new("taskkill")
                    .args(&["/F", "/PID", &pid.to_string()])
                    .creation_flags(0x08000000)
                    .output();

                match kill_output {
                    Ok(output) if output.status.success() => {
                        killed_count += 1;
                    }
                    _ => {
                        failed_pids.push(pid);
                    }
                }
            }
        }
    }

    if failed_pids.is_empty() {
        if killed_count > 0 {
            Ok(format!(
                "{{\"success\": \"Successfully killed {} SteamUtility.exe processes\"}}",
                killed_count
            ))
        } else {
            Ok(format!(
                "{{\"success\": \"No SteamUtility.exe processes found to kill\"}}"
            ))
        }
    } else {
        Err(format!(
            "{{\"error\": \"Killed {} processes, but failed to kill PIDs: {:?}\"}}",
            killed_count, failed_pids
        ))
    }
}

// Helper function to clean up dead processes
fn cleanup_dead_processes() -> Result<(), String> {
    let mut processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
    let mut i = 0;
    while i < processes.len() {
        if let Ok(status) = processes[i].child.try_wait() {
            if status.is_some() {
                processes.remove(i);
            } else {
                i += 1;
            }
        } else {
            processes.remove(i);
        }
    }
    Ok(())
}
