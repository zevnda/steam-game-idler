use chrono::Local;
use std::fs::{create_dir_all, OpenOptions};
use std::io::{BufRead, BufReader, Seek, SeekFrom, Write};
use std::os::windows::process::CommandExt;

const APP_FOLDER_NAME: &str = "steam-game-idler";
const MAX_LINES: usize = 500;

#[tauri::command]
pub fn log_event(message: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    // Create the application-specific directory
    let app_specific_dir = app_data_dir
        .parent()
        .unwrap_or(&app_data_dir)
        .join(APP_FOLDER_NAME);
    create_dir_all(&app_specific_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;
    // Open the log file
    let log_file_path = app_specific_dir.join("log.txt");
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    // Read existing log lines
    let reader = BufReader::new(&file);
    let mut lines: Vec<String> = reader
        .lines()
        .map(|line| line.unwrap_or_default())
        .collect();
    // Create a new log entry with a timestamp
    let timestamp = Local::now().format("%b %d %H:%M:%S%.3f").to_string();
    let mask_one = mask_sensitive_data(&message, "711B8063");
    let mask_two = mask_sensitive_data(&mask_one, "3DnyBUX");
    let mask_three = mask_sensitive_data(&mask_two, "5e2699aef2301b283");
    let new_log = format!("{} + {}", timestamp, mask_three);
    // Insert the new log entry at the beginning
    lines.insert(0, new_log);
    // Truncate the log if it exceeds the maximum number of lines
    if lines.len() > MAX_LINES {
        lines.truncate(MAX_LINES);
    }
    // Write the updated log back to the file
    file.seek(SeekFrom::Start(0))
        .map_err(|e| format!("Failed to seek to start of file: {}", e))?;
    file.set_len(0)
        .map_err(|e| format!("Failed to truncate file: {}", e))?;
    for line in lines {
        writeln!(file, "{}", line).map_err(|e| format!("Failed to write to log file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn clear_log_file(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    // Create the application-specific directory
    let app_specific_dir = app_data_dir
        .parent()
        .unwrap_or(&app_data_dir)
        .join(APP_FOLDER_NAME);
    // Open the log file
    let log_file_path = app_specific_dir.join("log.txt");
    let file = OpenOptions::new()
        .write(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    // Truncate the log file
    file.set_len(0)
        .map_err(|e| format!("Failed to truncate file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_app_log_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    // Create the application-specific directory
    let app_specific_dir = app_data_dir
        .parent()
        .unwrap_or(&app_data_dir)
        .join(APP_FOLDER_NAME);
    // Convert the path to a string and return it
    app_specific_dir
        .to_str()
        .ok_or("Failed to convert path to string".to_string())
        .map(|s| s.to_string())
}

#[tauri::command]
pub fn open_file_explorer(path: String) -> Result<(), String> {
    // Open the file explorer and select the specified path
    std::process::Command::new("explorer")
        .args(["/select,", &path])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn mask_sensitive_data(message: &str, sensitive_data: &str) -> String {
    // Mask sensitive data in log messages
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
