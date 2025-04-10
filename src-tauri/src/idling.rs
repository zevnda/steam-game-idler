use crate::process_handler::{cleanup_dead_processes, kill_all_steamutil_processes};
use crate::utils::get_lib_path;
use serde_json::{json, Value};
use std::os::windows::process::CommandExt;
use std::process::Child;
use std::process::Command;
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
// Start idling a game
pub async fn start_idle(app_id: u32, app_name: String) -> Result<Value, String> {
    cleanup_dead_processes().map_err(|e| e.to_string())?;

    let exe_path = get_lib_path()?;

    let child = Command::new(exe_path)
        .args(&["idle", &app_id.to_string(), app_name.as_str()])
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
            Ok(Some(_)) => Ok(json!({"error": "Failed to start idling game"})),
            Ok(None) => Ok(json!({"success": "Successfully started idling game"})),
            Err(e) => Ok(json!({"error": e.to_string()})),
        }
    } else {
        Ok(json!({"error": "No processes found"}))
    }
}

#[tauri::command]
// Stop idling a game by killing its process
pub async fn stop_idle(app_id: u32) -> Result<Value, String> {
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

    Ok(json!({"success": "Successfully stopped idling game"}))
}

#[derive(serde::Deserialize)]
pub struct GameInfo {
    app_id: u32,
    name: String,
}

#[tauri::command]
// Start idling multiple games
pub async fn start_farm_idle(games_list: Vec<GameInfo>) -> Result<Value, String> {
    let exe_path = get_lib_path()?;

    cleanup_dead_processes().map_err(|e| e.to_string())?;

    let mut failed = false;
    let app_ids: Vec<u32> = games_list.iter().map(|game| game.app_id).collect();

    for game in &games_list {
        let child = Command::new(&exe_path)
            .args(&["idle", &game.app_id.to_string(), &game.name])
            .creation_flags(0x08000000)
            .spawn()
            .map_err(|e| e.to_string())?;

        let pid = child.id();

        {
            let mut processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
            processes.push(ProcessInfo {
                child,
                app_id: game.app_id,
                pid,
            });
        }
    }

    tokio::time::sleep(Duration::from_millis(1000)).await;

    // Check if all processes are still running
    {
        let mut processes = SPAWNED_PROCESSES.lock().map_err(|e| e.to_string())?;
        for process in processes.iter_mut() {
            if app_ids.contains(&process.app_id) {
                match process.child.try_wait() {
                    Ok(Some(_)) => {
                        failed = true;
                        break;
                    }
                    Err(_) => {
                        failed = true;
                        break;
                    }
                    Ok(None) => {}
                }
            }
        }
    }

    if failed {
        // Kill all SteamUtility processes if any failed
        let _ = kill_all_steamutil_processes().await;

        Ok(json!({"error": "Failed to start one or more idle processes"}))
    } else {
        Ok(json!({"success": "Successfully started idling games"}))
    }
}

#[tauri::command]
// Stop idling all games by killing their processes
pub async fn stop_farm_idle() -> Result<Value, String> {
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

    Ok(json!({"success": "Successfully stopped idling games"}))
}
