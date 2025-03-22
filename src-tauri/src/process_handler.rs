use crate::idling::SPAWNED_PROCESSES;
use serde_json::{json, Value};
use std::os::windows::process::CommandExt;

#[tauri::command]
// Get all running SteamUtility processes
pub async fn get_running_processes() -> Result<Value, String> {
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

    let output_str = String::from_utf8_lossy(&output.stdout).to_string();

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

    Ok(json!({"processes": processes}))
}

#[tauri::command]
// Kill a process by its PID
pub async fn kill_process_by_pid(pid: u32) -> Result<Value, String> {
    cleanup_dead_processes().map_err(|e| e.to_string())?;

    let output = std::process::Command::new("taskkill")
        .args(&["/F", "/PID", &pid.to_string()])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(json!({"success": "Successfully killed process with PID"}))
    } else {
        Ok(json!({"error": "Failed to kill process with PID"}))
    }
}

#[tauri::command]
// Kill all SteamUtility.exe processes
pub async fn kill_all_steamutil_processes() -> Result<Value, String> {
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
            Ok(json!({
                "success": "Successfully killed all SteamUtility.exe processes",
                "killed_count": killed_count
            }))
        } else {
            Ok(json!({"error": "No SteamUtility.exe processes found"}))
        }
    } else {
        Ok(json!({
            "error": format!(
                "{{\"error\": \"Killed {} processes, but failed to kill PIDs: {:?}\"}}",
                killed_count, failed_pids
            )
        }))
    }
}

// Helper function to clean up dead processes
pub fn cleanup_dead_processes() -> Result<(), String> {
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
