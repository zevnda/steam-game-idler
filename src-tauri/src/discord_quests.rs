use crate::utils::{get_cache_dir, get_discord_quests_utility_path};
use std::fs;
use std::os::windows::process::CommandExt;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

#[derive(Debug)]
pub struct QuestProcessInfo {
    pub child: Child,
    pub name: String,
    pub pid: u32,
}

lazy_static::lazy_static! {
    pub static ref QUEST_PROCESSES: Arc<Mutex<Vec<QuestProcessInfo>>> = Arc::new(Mutex::new(Vec::new()));
}

#[tauri::command]
pub fn start_discord_quest(app: AppHandle, quest_name: String) -> Result<String, String> {
    let exe_path = get_discord_quests_utility_path()?;

    // Get the cache directory and create quests folder
    let cache_dir = get_cache_dir(&app)?;
    let quests_dir = cache_dir.join("quests");

    // Create quests directory if it doesn't exist
    fs::create_dir_all(&quests_dir)
        .map_err(|e| format!("Failed to create quests directory: {}", e))?;

    // Ensure the new name has .exe extension
    let filename = if quest_name.ends_with(".exe") {
        quest_name.clone()
    } else {
        format!("{}.exe", quest_name)
    };

    let dest_path = quests_dir.join(&filename);

    // Copy exe to the destination
    fs::copy(&exe_path, &dest_path).map_err(|e| format!("Failed to copy exe: {}", e))?;

    // Run the renamed exe without showing a window
    let child = Command::new(&dest_path)
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;

    let pid = child.id();

    // Store the process info
    {
        let mut processes = QUEST_PROCESSES.lock().map_err(|e| e.to_string())?;
        processes.push(QuestProcessInfo {
            child,
            name: quest_name,
            pid,
        });
    }

    Ok(format!(
        "Successfully copied and executed: {}",
        dest_path.display()
    ))
}

#[tauri::command]
pub fn stop_discord_quest(quest_name: String) -> Result<String, String> {
    let pid = {
        let processes = QUEST_PROCESSES.lock().map_err(|e| e.to_string())?;
        processes
            .iter()
            .find(|p| p.name == quest_name)
            .map(|p| p.pid)
    }
    .ok_or_else(|| "No matching quest process found".to_string())?;

    let mut child = Command::new("taskkill")
        .args(&["/F", "/PID", &pid.to_string()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;

    child.wait().map_err(|e| e.to_string())?;

    // Remove from tracked processes
    if let Ok(mut processes) = QUEST_PROCESSES.lock() {
        processes.retain(|p| p.name != quest_name);
    }

    Ok(format!("Successfully stopped quest: {}", quest_name))
}
