use std::os::windows::process::CommandExt;
use std::os::windows::io::AsRawHandle;
use std::fs::{OpenOptions, create_dir_all};
use std::io::{BufRead, BufReader, Write, Seek, SeekFrom};
use std::sync::{Arc, Mutex};
use std::process::{Stdio, Child};
use std::path::PathBuf;
use winapi::um::processthreadsapi::TerminateProcess;
use winapi::um::winnt::HANDLE;
use chrono::Local;

const APP_FOLDER_NAME: &str = "steam-game-idler";
const MAX_LINES: usize = 500;

#[tauri::command]
pub async fn check_status() -> bool {
    let output = std::process::Command::new("tasklist")
        .args(&["/FI", "IMAGENAME eq steam.exe"])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .creation_flags(0x08000000) 
        .output()
        .expect("Failed to execute tasklist command");
    let output_str = String::from_utf8_lossy(&output.stdout);
    output_str.contains("steam.exe")
}

#[tauri::command]
pub async fn check_process_by_game_id(ids: Vec<String>) -> Result<Vec<String>, String> {
    let output = std::process::Command::new("tasklist")
    .args(&["/V", "/FO", "CSV", "/NH", "/FI", "IMAGENAME eq SteamUtility.exe"])
    .stdout(Stdio::piped())
    .stderr(Stdio::null())
    .creation_flags(0x08000000)
    .output()
    .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    Ok(ids.into_iter()
        .filter(|id| !output_str.contains(&format!("[{}]", id)))
        .collect())
}

#[tauri::command]
pub async fn check_steam_status(file_path: String) -> Result<String, String> {
    let output = std::process::Command::new(file_path)
        .arg("check_steam")
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;
    let output_str = String::from_utf8_lossy(&output.stdout);
    if output_str.contains("Steam is not running") {
        Ok("not_running".to_string())
    } else {
        let steam_id = output_str
            .split("steamId ")
            .nth(1)
            .ok_or("Failed to parse Steam ID")?
            .trim();
        Ok(steam_id.to_string())
    }
}

#[tauri::command]
pub async fn anti_away() -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(&["/C", "start steam://friends/status/online"])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_file_path() -> Result<PathBuf, String> {
    match std::env::current_exe() {
        Ok(path) => return Ok(path),
        Err(error) => return Err(format!("{error}")),
    }
}

#[tauri::command]
pub fn log_event(message: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app_handle.path_resolver().app_data_dir()
        .ok_or("Failed to get app data directory")?;
    let app_specific_dir = app_data_dir.parent().unwrap_or(&app_data_dir).join(APP_FOLDER_NAME);
    create_dir_all(&app_specific_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;
    let log_file_path = app_specific_dir.join("log.txt");
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    let reader = BufReader::new(&file);
    let mut lines: Vec<String> = reader.lines()
        .map(|line| line.unwrap_or_default())
        .collect();
    let timestamp = Local::now().format("%b %d %H:%M:%S%.3f").to_string();
    let mask_one = mask_sensitive_data(&message, "711B8063");
    let mask_two = mask_sensitive_data(&mask_one, "3DnyBUX");
    let mask_three = mask_sensitive_data(&mask_two, "5e2699aef2301b283");
    let new_log = format!("{} + {}", timestamp, mask_three);
    lines.insert(0, new_log);
    if lines.len() > MAX_LINES {
        lines.truncate(MAX_LINES);
    }
    file.seek(SeekFrom::Start(0))
        .map_err(|e| format!("Failed to seek to start of file: {}", e))?;
    file.set_len(0)
        .map_err(|e| format!("Failed to truncate file: {}", e))?;
    for line in lines {
        writeln!(file, "{}", line)
            .map_err(|e| format!("Failed to write to log file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn clear_log_file(app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app_handle.path_resolver().app_data_dir()
        .ok_or("Failed to get app data directory")?;
    let app_specific_dir = app_data_dir.parent().unwrap_or(&app_data_dir).join(APP_FOLDER_NAME);
    let log_file_path = app_specific_dir.join("log.txt");
    let file = OpenOptions::new()
        .write(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    file.set_len(0)
        .map_err(|e| format!("Failed to truncate file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_app_log_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle.path_resolver().app_data_dir()
        .ok_or("Failed to get app data directory")?;
    let app_specific_dir = app_data_dir.parent().unwrap_or(&app_data_dir).join(APP_FOLDER_NAME);
    app_specific_dir.to_str()
        .ok_or("Failed to convert path to string".to_string())
        .map(|s| s.to_string())
}

#[tauri::command]
pub fn open_file_explorer(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .args(["/select,", &path])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn kill_processes(spawned_processes: &Arc<Mutex<Vec<Child>>>) {
    let mut processes = spawned_processes.lock().unwrap();
    for child in processes.iter_mut() {
        unsafe {
            let handle = child.as_raw_handle() as HANDLE;
            TerminateProcess(handle, 1);
        }
        let _ = child.wait();
    }
    processes.clear();
    std::process::exit(0);
}

pub fn mask_sensitive_data(message: &str, sensitive_data: &str) -> String {
    if let Some(start_index) = message.find(sensitive_data) {
        let end_index = start_index + sensitive_data.len();
        let mask_start = start_index.saturating_sub(5);
        let mask_end = (end_index + 5).min(message.len());
        let mask_length = mask_end - mask_start;
        
        let mut masked_message = message.to_string();
        masked_message.replace_range(mask_start..mask_end, &"*".repeat(mask_length));
        masked_message
    } else {
        message.to_string()
    }
}