use serde_json::{json, Value};
use std::fs;
use std::fs::File;
use std::io::Read;
use std::io::Write;
use tauri::Manager;

// Default settings
fn get_default_settings() -> Value {
    json!({
        "gameSettings": null,
        "general": {
            "antiAway": false,
            "freeGameNotifications": true,
            "apiKey": null,
            "useBeta": false,
            "disableTooltips": false,
            "runAtStartup": false,
            "startMinimized": false
        },
        "cardFarming": {
            "listGames": true,
            "allGames": false,
            "nextTaskCheckbox": false,
            "nextTask": null,
            "credentials": null,
            "userSummary": null,
            "gamesWithDrops": 0,
            "totalDropsRemaining": 0
        },
        "achievementUnlocker": {
            "idle": true,
            "hidden": false,
            "schedule": false,
            "scheduleFrom": {
                "hour": 8,
                "minute": 30,
                "second": 0,
                "millisecond": 0
            },
            "scheduleTo": {
                "hour": 23,
                "minute": 0,
                "second": 0,
                "millisecond": 0
            },
            "interval": [
                30,
                130
            ]
        }
    })
}

#[tauri::command]
pub async fn get_user_settings(
    steam_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache")
        .join(steam_id.clone());

    // Create cache directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    // Define the settings file path
    let settings_file_path = app_data_dir.join("settings.json");

    // Get default settings
    let default_settings = get_default_settings();

    // Read the settings file or create with default settings if it doesn't exist
    let settings = if settings_file_path.exists() {
        let mut file = File::open(&settings_file_path)
            .map_err(|e| format!("Failed to open settings file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse settings JSON: {}", e))?
    } else {
        // Create a new file with default settings
        let json_string = serde_json::to_string_pretty(&default_settings)
            .map_err(|e| format!("Failed to serialize default settings JSON: {}", e))?;
        let mut file = File::create(&settings_file_path)
            .map_err(|e| format!("Failed to create settings file: {}", e))?;
        file.write_all(json_string.as_bytes())
            .map_err(|e| format!("Failed to write to settings file: {}", e))?;
        default_settings
    };

    Ok(json!({
        "settings": settings
    }))
}

#[tauri::command]
pub async fn update_user_settings(
    steam_id: String,
    key: String,
    value: Value,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache")
        .join(steam_id.clone());

    // Create cache directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    // Define the settings file path
    let settings_file_path = app_data_dir.join("settings.json");

    // Read current settings or create with default settings if it doesn't exist
    let mut settings = if settings_file_path.exists() {
        let mut file = File::open(&settings_file_path)
            .map_err(|e| format!("Failed to open settings file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse settings JSON: {}", e))?
    } else {
        get_default_settings()
    };

    // Parse the key
    let path_parts: Vec<&str> = key.split('.').collect();
    if path_parts.is_empty() {
        return Err("Invalid key path".to_string());
    }

    // Navigate through the JSON structure and update the specified value
    let mut current = &mut settings;
    for (i, &part) in path_parts.iter().enumerate() {
        if i == path_parts.len() - 1 {
            // This is the final key to update
            if let Some(obj) = current.as_object_mut() {
                obj.insert(part.to_string(), value.clone());
            } else {
                return Err(format!(
                    "Cannot update key '{}': parent is not an object",
                    part
                ));
            }
        } else {
            // Navigate to the next level in the JSON structure
            if let Some(obj) = current.as_object_mut() {
                if !obj.contains_key(part) {
                    obj.insert(part.to_string(), json!({}));
                }
                current = obj.get_mut(part).unwrap();
            } else {
                return Err(format!(
                    "Cannot navigate to key '{}': parent is not an object",
                    part
                ));
            }
        }
    }

    // Write the updated settings back to the file
    let json_string = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings JSON: {}", e))?;
    let mut file = File::create(&settings_file_path)
        .map_err(|e| format!("Failed to create settings file: {}", e))?;
    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write to settings file: {}", e))?;

    Ok(json!({
        "settings": settings
    }))
}

#[tauri::command]
pub async fn reset_user_settings(
    steam_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache")
        .join(steam_id.clone());

    // Create cache directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    // Define the settings file path
    let settings_file_path = app_data_dir.join("settings.json");

    // Get default settings
    let default_settings = get_default_settings();

    // Create or overwrite the settings file with default settings
    let json_string = serde_json::to_string_pretty(&default_settings)
        .map_err(|e| format!("Failed to serialize default settings JSON: {}", e))?;
    let mut file = File::create(&settings_file_path)
        .map_err(|e| format!("Failed to create settings file: {}", e))?;
    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write to settings file: {}", e))?;

    Ok(json!({
        "settings": default_settings
    }))
}

pub async fn check_start_minimized_setting(app_handle: &tauri::AppHandle) -> Result<bool, String> {
    use serde_json::Value;
    use std::fs::File;
    use std::io::Read;

    // Get the application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache");

    // Look for any user settings file to check the startMinimized setting
    if let Ok(entries) = std::fs::read_dir(&app_data_dir) {
        for entry in entries.flatten() {
            if entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                let settings_file = entry.path().join("settings.json");
                if settings_file.exists() {
                    if let Ok(mut file) = File::open(&settings_file) {
                        let mut contents = String::new();
                        if file.read_to_string(&mut contents).is_ok() {
                            if let Ok(settings) = serde_json::from_str::<Value>(&contents) {
                                if let Some(general) = settings.get("general") {
                                    if let Some(start_minimized) = general.get("startMinimized") {
                                        return Ok(start_minimized.as_bool().unwrap_or(false));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Default to false if no setting found
    Ok(false)
}
