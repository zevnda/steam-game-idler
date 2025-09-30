use crate::utils::{get_cache_dir, get_lib_path};
use serde_json::{json, Value};
use std::fs::File;
use std::io::Read;
use std::os::windows::process::CommandExt;

#[tauri::command]
pub async fn get_achievement_data(
    steam_id: String,
    app_id: u32,
    refetch: Option<bool>,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?
        .join(steam_id.clone())
        .join("achievement_data");

    let file_name = format!("{}.json", app_id);
    let achievement_file_path = app_data_dir.join(&file_name);

    // Check if file already exists and whether we should use it
    let should_fetch_new = refetch.unwrap_or(false) || !achievement_file_path.exists();

    let achievement_data = if should_fetch_new {
        // Fetch new data
        let exe_path = get_lib_path()?;
        let output = std::process::Command::new(exe_path)
            .args(&["get_achievement_data", &app_id.to_string()])
            .creation_flags(0x08000000)
            .output()
            .map_err(|e| format!("Failed to execute unlocker: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);

        if output_str.contains("error") {
            return Ok(output_str.to_string().into());
        }

        if output_str.contains("success") {
            if achievement_file_path.exists() {
                let mut file = File::open(&achievement_file_path)
                    .map_err(|e| format!("Failed to open achievement file: {}", e))?;
                let mut contents = String::new();
                file.read_to_string(&mut contents)
                    .map_err(|e| format!("Failed to read achievement file: {}", e))?;
                serde_json::from_str(&contents)
                    .map_err(|e| format!("Failed to parse achievement JSON: {}", e))?
            } else {
                json!({})
            }
        } else {
            json!({})
        }
    } else {
        // Read existing file
        let mut file = File::open(&achievement_file_path)
            .map_err(|e| format!("Failed to open achievement file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| format!("Failed to read achievement file: {}", e))?;
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse achievement JSON: {}", e))?
    };

    Ok(json!({"achievement_data": achievement_data}))
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
