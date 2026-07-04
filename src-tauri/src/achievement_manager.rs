use crate::utils::{get_cache_dir, get_lib_path};
use lazy_static::lazy_static;
use serde_json::{json, Value};
use std::fs::File;
use std::io::Read;
use std::os::windows::process::CommandExt;
use tokio::sync::Semaphore;

lazy_static! {
    // Caps concurrent SteamUtility.exe child processes spawned for achievement/stat
    // operations
    static ref ACHIEVEMENT_PROCESS_LIMIT: Semaphore = Semaphore::new(6);
}

// Runs a SteamUtility.exe subcommand off the async runtime's worker threads and
// throttles concurrent achievement-related processes
async fn run_lib_command(args: Vec<String>) -> Result<String, String> {
    let _permit = ACHIEVEMENT_PROCESS_LIMIT
        .acquire()
        .await
        .map_err(|e| format!("Failed to acquire achievement process slot: {}", e))?;

    let exe_path = get_lib_path()?;
    let output = tokio::task::spawn_blocking(move || {
        std::process::Command::new(exe_path)
            .args(&args)
            .creation_flags(0x08000000)
            .output()
    })
    .await
    .map_err(|e| format!("Failed to join blocking task: {}", e))?
    .map_err(|e| format!("Failed to execute unlocker: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

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
        let cache_dir = get_cache_dir(&app_handle)?;
        let cache_dir_str = cache_dir.to_string_lossy().to_string();

        // Fetch new data
        let output_str = run_lib_command(vec![
            "get_achievement_data".to_string(),
            app_id.to_string(),
            cache_dir_str,
        ])
        .await?;

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
    run_lib_command(vec![
        "unlock_achievement".to_string(),
        app_id.to_string(),
        achievement_id.to_string(),
    ])
    .await
}

#[tauri::command]
// Lock an achievement
pub async fn lock_achievement(app_id: u32, achievement_id: &str) -> Result<String, String> {
    run_lib_command(vec![
        "lock_achievement".to_string(),
        app_id.to_string(),
        achievement_id.to_string(),
    ])
    .await
}

#[tauri::command]
// Unlock an achievement
pub async fn toggle_achievement(app_id: u32, achievement_id: &str) -> Result<String, String> {
    run_lib_command(vec![
        "toggle_achievement".to_string(),
        app_id.to_string(),
        achievement_id.to_string(),
    ])
    .await
}

#[tauri::command]
// Unlock all achievements
pub async fn unlock_all_achievements(app_id: u32) -> Result<String, String> {
    run_lib_command(vec![
        "unlock_all_achievements".to_string(),
        app_id.to_string(),
    ])
    .await
}

#[tauri::command]
// Lock all achievements
pub async fn lock_all_achievements(app_id: u32) -> Result<String, String> {
    run_lib_command(vec![
        "lock_all_achievements".to_string(),
        app_id.to_string(),
    ])
    .await
}

#[tauri::command]
// Update achievement statistic
pub async fn update_stats(app_id: u32, stats_arr: &str) -> Result<String, String> {
    run_lib_command(vec![
        "update_stats".to_string(),
        app_id.to_string(),
        stats_arr.to_string(),
    ])
    .await
}

#[tauri::command]
// Reset all achievement statistics
pub async fn reset_all_stats(app_id: u32) -> Result<String, String> {
    run_lib_command(vec!["reset_all_stats".to_string(), app_id.to_string()]).await
}
