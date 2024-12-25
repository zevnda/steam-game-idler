use std::os::windows::process::CommandExt;
use std::process::Child;
use std::sync::{Arc, Mutex};

lazy_static::lazy_static! {
    pub static ref SPAWNED_PROCESSES: Arc<Mutex<Vec<Child>>> = Arc::new(Mutex::new(Vec::new()));
}

#[tauri::command]
// Get Steam users
pub async fn get_steam_users(file_path: String) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .arg("get_steam_users")
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    if let Some(users) = output_str.split("steamUsers ").nth(1) {
        Ok(users.trim().to_string())
    } else {
        Ok("{\"error\": \"Failed to get Steam users\"}".to_string())
    }
}

#[tauri::command]
// Start idling a game
pub async fn start_idle(
    file_path: String,
    app_id: String,
    quiet: String,
) -> Result<String, String> {
    let child = std::process::Command::new(&file_path)
        .args(&["idle", &app_id, &quiet])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;

    SPAWNED_PROCESSES.lock().unwrap().push(child);

    std::thread::sleep(std::time::Duration::from_millis(1000));

    let mut processes = SPAWNED_PROCESSES.lock().unwrap();
    if let Some(last_child) = processes.last_mut() {
        match last_child.try_wait() {
            Ok(Some(_)) => return Ok("{\"error\": \"Failed to idle game\"}".to_string()),
            Ok(None) => Ok("{\"message\": \"Ok\"}".to_string()),
            Err(e) => return Err(e.to_string()),
        }
    } else {
        Ok("{\"error\": \"No process found\"}".to_string())
    }
}

#[tauri::command]
// Stop idling a game by killing its process
pub async fn stop_idle(app_id: String) -> Result<(), String> {
    let wmic_output = std::process::Command::new("wmic")
        .args(&["process", "get", "processid,commandline"])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to get process");
    let wmic_stdout = String::from_utf8_lossy(&wmic_output.stdout);
    let pid = wmic_stdout
        .lines()
        .find(|line| line.contains(&app_id))
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
// Toggle an achievement
pub async fn toggle_achievement(
    file_path: String,
    app_id: String,
    achievement_id: String,
) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .args(&["toggle_achievement", &app_id, &achievement_id])
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    if output_str.contains("error") {
        Ok("{\"error\": \"Failed to toggle achievement\"}".to_string())
    } else {
        Ok("{\"message\": \"Ok\"}".to_string())
    }
}

#[tauri::command]
// Uunlock an achievement
pub async fn unlock_achievement(
    file_path: String,
    app_id: String,
    achievement_id: String,
) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .args(&["unlock_achievement", &app_id, &achievement_id])
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    if output_str.contains("error") {
        Ok("{\"error\": \"Failed to unlck achievement\"}".to_string())
    } else {
        Ok("{\"message\": \"Ok\"}".to_string())
    }
}

#[tauri::command]
// Lock an achievement
pub async fn lock_achievement(
    file_path: String,
    app_id: String,
    achievement_id: String,
) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .args(&["lock_achievement", &app_id, &achievement_id])
        .output()
        .expect("failed to execute unlocker");

    let output_str = String::from_utf8_lossy(&output.stdout);
    if output_str.contains("error") {
        Ok("{\"error\": \"Failed to lock achievement\"}".to_string())
    } else {
        Ok("{\"message\": \"Ok\"}".to_string())
    }
}

#[tauri::command]
// Update achievement statistic
pub async fn update_stats(
    file_path: String,
    app_id: String,
    stat_name: String,
    new_value: String,
) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .args(&["update_stats", &app_id, &stat_name, &new_value])
        .output()
        .expect("failed to execute stat updater");

    let output_str = String::from_utf8_lossy(&output.stdout);
    if output_str.contains("error") {
        Ok("{\"error\": \"Failed to update stat\"}".to_string())
    } else {
        Ok("{\"message\": \"Ok\"}".to_string())
    }
}

#[tauri::command]
// Reset all achievement statistics
pub async fn reset_stats(file_path: String, app_id: String) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .args(&["reset_stats", &app_id])
        .output()
        .expect("failed to execute stat updater");

    let output_str = String::from_utf8_lossy(&output.stdout);
    if output_str.contains("error") {
        Ok("{\"error\": \"Failed to reset stats\"}".to_string())
    } else {
        Ok("{\"message\": \"Ok\"}".to_string())
    }
}
