use crate::utils::get_cache_dir;
use serde_json::{json, Value};
use std::fs;
use std::fs::File;
use std::io::Read;
use std::io::Write;

#[tauri::command]
pub async fn get_custom_lists(
    steam_id: String,
    list: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?
        .join(steam_id.clone())
        .join("custom_lists");

    // Create cache directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    // Determine file name based on list type
    let file_name = match list.as_str() {
        "cardFarmingList" => format!("card_farming.json"),
        "achievementUnlockerList" => format!("achievement_unlocker.json"),
        "autoIdleList" => format!("auto_idle.json"),
        "favoritesList" => format!("favorites.json"),
        _ => return Err(format!("Unknown list type: {}", list)),
    };

    // Read the specified list file
    let games_file_path = app_data_dir.join(file_name);
    let list_data = if games_file_path.exists() {
        let mut file = File::open(&games_file_path)
            .map_err(|e| format!("Failed to open games list file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| format!("Failed to read games list file: {}", e))?;
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse games list JSON: {}", e))?
    } else {
        // Create a new file with an empty array
        let empty_array = json!([]);
        let json_string = serde_json::to_string_pretty(&empty_array)
            .map_err(|e| format!("Failed to serialize empty list JSON: {}", e))?;
        let mut file = File::create(&games_file_path)
            .map_err(|e| format!("Failed to create list file: {}", e))?;
        file.write_all(json_string.as_bytes())
            .map_err(|e| format!("Failed to write to list file: {}", e))?;
        empty_array
    };

    Ok(json!({
        "list_data": list_data
    }))
}

#[tauri::command]
pub async fn add_game_to_custom_list(
    steam_id: String,
    game: Value,
    list: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?
        .join(steam_id.clone())
        .join("custom_lists");

    // Determine file name based on list type
    let file_name = match list.as_str() {
        "cardFarmingList" => format!("card_farming.json"),
        "achievementUnlockerList" => format!("achievement_unlocker.json"),
        "autoIdleList" => format!("auto_idle.json"),
        "favoritesList" => format!("favorites.json"),
        _ => return Err(format!("Unknown list type: {}", list)),
    };

    let file_path = app_data_dir.join(&file_name);

    // Check if the file exists
    if !file_path.exists() {
        return Ok(json!({"error": "List doesn't exist"}));
    }

    // Read existing data or create new empty array
    let mut games_list: Value = if file_path.exists() {
        let mut file =
            File::open(&file_path).map_err(|e| format!("Failed to open list file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| format!("Failed to read list file: {}", e))?;
        serde_json::from_str(&contents).map_err(|e| format!("Failed to parse list JSON: {}", e))?
    } else {
        json!([])
    };

    // Check if games_list is an array, if not, initialize it as an empty array
    if !games_list.is_array() {
        games_list = json!([]);
    }

    // Check if the game already exists in the list
    let games_array = games_list.as_array_mut().unwrap();
    let game_already_exists = games_array.iter().any(|existing_game| {
        existing_game.get("appid").and_then(|id| id.as_u64())
            == game.get("appid").and_then(|id| id.as_u64())
    });

    // Add game if it doesn't already exist
    if !game_already_exists {
        games_array.push(game.clone());

        // Write updated list back to file
        let json_string = serde_json::to_string_pretty(&games_list)
            .map_err(|e| format!("Failed to serialize list JSON: {}", e))?;

        let mut file =
            File::create(&file_path).map_err(|e| format!("Failed to create list file: {}", e))?;

        file.write_all(json_string.as_bytes())
            .map_err(|e| format!("Failed to write to list file: {}", e))?;

        Ok(json!({
            "list_data": games_list
        }))
    } else {
        Ok(json!({
            "error": "Game already in list",
            "list_data": games_list
        }))
    }
}

#[tauri::command]
pub async fn remove_game_from_custom_list(
    steam_id: String,
    game: Value,
    list: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?
        .join(steam_id.clone())
        .join("custom_lists");

    // Determine file name based on list type
    let file_name = match list.as_str() {
        "cardFarmingList" => format!("card_farming.json"),
        "achievementUnlockerList" => format!("achievement_unlocker.json"),
        "autoIdleList" => format!("auto_idle.json"),
        "favoritesList" => format!("favorites.json"),
        _ => return Err(format!("Unknown list type: {}", list)),
    };

    let file_path = app_data_dir.join(&file_name);

    // Check if the file exists
    if !file_path.exists() {
        return Ok(json!({"error": "List doesn't exist"}));
    }

    // Read existing data
    let mut file =
        File::open(&file_path).map_err(|e| format!("Failed to open list file: {}", e))?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read list file: {}", e))?;

    let mut games_list: Value =
        serde_json::from_str(&contents).map_err(|e| format!("Failed to parse list JSON: {}", e))?;

    // Check if games_list is an array, if not, return error
    if !games_list.is_array() {
        return Ok(json!({"error": "List is not in expected format"}));
    }

    // Get the appid to remove
    let appid_to_remove = game
        .get("appid")
        .and_then(|id| id.as_u64())
        .ok_or_else(|| "Invalid game format: missing appid".to_string())?;

    // Remove the game from the list
    let games_array = games_list.as_array_mut().unwrap();
    let initial_length = games_array.len();

    games_array.retain(|existing_game| {
        existing_game
            .get("appid")
            .and_then(|id| id.as_u64())
            .unwrap_or(0)
            != appid_to_remove
    });

    // Check if game was actually removed
    if games_array.len() == initial_length {
        return Ok(json!({
            "error": "Game not found in list",
            "list_data": games_list
        }));
    }

    // Write updated list back to file
    let json_string = serde_json::to_string_pretty(&games_list)
        .map_err(|e| format!("Failed to serialize list JSON: {}", e))?;

    let mut file =
        File::create(&file_path).map_err(|e| format!("Failed to create list file: {}", e))?;

    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write to list file: {}", e))?;

    Ok(json!({
        "list_data": games_list
    }))
}

#[tauri::command]
pub async fn update_custom_list(
    steam_id: String,
    new_list: Value,
    list: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?
        .join(steam_id.clone())
        .join("custom_lists");

    // Determine file name based on list type
    let file_name = match list.as_str() {
        "cardFarmingList" => format!("card_farming.json"),
        "achievementUnlockerList" => format!("achievement_unlocker.json"),
        "autoIdleList" => format!("auto_idle.json"),
        "favoritesList" => format!("favorites.json"),
        _ => return Err(format!("Unknown list type: {}", list)),
    };

    let file_path = app_data_dir.join(&file_name);

    // Validate that the new list is an array
    if !new_list.is_array() {
        return Err("New list must be an array".to_string());
    }

    // Write the new list to the file
    let json_string = serde_json::to_string_pretty(&new_list)
        .map_err(|e| format!("Failed to serialize list JSON: {}", e))?;

    let mut file =
        File::create(&file_path).map_err(|e| format!("Failed to create list file: {}", e))?;

    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write to list file: {}", e))?;

    Ok(json!({
        "list_data": new_list
    }))
}
