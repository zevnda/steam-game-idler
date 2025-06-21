use crate::utils::get_steam_location;
use regex::Regex;
use reqwest::Client;
use serde_json;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::fs::{create_dir_all, File, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
// Get Steam users
pub async fn get_users() -> Result<Value, String> {
    let steam_loc = get_steam_location().await.map_err(|e| e.to_string())?;
    let steam_loc_path = PathBuf::from(steam_loc);

    // Parse the loginusers.vdf file
    match parse_login_users(&steam_loc_path) {
        Ok(users) => {
            if !users.is_empty() {
                // Create a list of users with personaName, steamId, and mostRecent
                let user_list: Vec<HashMap<&str, Value>> = users
                    .iter()
                    .map(|(key, (name, most_recent))| {
                        let mut user = HashMap::new();
                        user.insert("personaName", Value::String(name.clone()));
                        user.insert("steamId", Value::String(key.clone()));
                        user.insert("mostRecent", Value::Number((*most_recent).into()));
                        user
                    })
                    .collect();

                // Return the user list directly as JSON
                return Ok(json!({
                    "users": user_list,
                }));
            }
            // If no users are found, return an empty list
            Ok(json!({
                "error": "No users found",
                "users": [],
            }))
        }
        Err(err) => {
            return Ok(json!({
                "error": err,
                "users": [],
            }));
        }
    }
}

#[tauri::command]
pub async fn get_user_summary(
    steam_id: String,
    api_key: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the API key from the envor use the provided one
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={}&steamids={}",
        key, steam_id
    );

    let client = Client::new();

    // Send the request and handle the response
    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;

            // Get the application data directory
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?
                .join("cache");
            create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app directory: {}", e))?;

            let file_path = app_data_dir.join("user_summaries.json");

            // Read existing cache or create empty array
            let mut cached_summaries: Vec<Value> = if file_path.exists() {
                let mut file = File::open(&file_path)
                    .map_err(|e| format!("Failed to open user summaries file: {}", e))?;
                let mut contents = String::new();
                file.read_to_string(&mut contents)
                    .map_err(|e| format!("Failed to read user summaries file: {}", e))?;

                if contents.trim().is_empty() {
                    Vec::new()
                } else {
                    serde_json::from_str(&contents)
                        .map_err(|e| format!("Failed to parse user summaries JSON: {}", e))?
                }
            } else {
                Vec::new()
            };

            // Check if this user already exists in the cache and remove it
            cached_summaries.retain(|summary| {
                if let Some(players) = summary["response"]["players"].as_array() {
                    if let Some(player) = players.first() {
                        if let Some(cached_steam_id) = player["steamid"].as_str() {
                            return cached_steam_id != steam_id;
                        }
                    }
                }
                true
            });

            // Add the new user summary
            cached_summaries.push(body.clone());

            // Write back to file
            let mut file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(&file_path)
                .map_err(|e| format!("Failed to open user summaries file for writing: {}", e))?;

            let json_string = serde_json::to_string_pretty(&cached_summaries)
                .map_err(|e| format!("Failed to serialize user summaries: {}", e))?;
            file.write_all(json_string.as_bytes())
                .map_err(|e| format!("Failed to write user summaries to file: {}", e))?;

            Ok(body)
        }
        Err(err) => Err(err.to_string()),
    }
}

pub fn parse_login_users(config_path: &PathBuf) -> Result<HashMap<String, (String, i32)>, String> {
    let content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let user_regex = Regex::new(
        r#""(\d{17})"\s*\{[^}]*"(?i)PersonaName"\s*"([^"]*)"|"(?i)MostRecent"\s*"(\d+)""#,
    )
    .map_err(|e| e.to_string())?;
    let mut users = HashMap::new();

    let mut current_steam_id = String::new();
    let mut current_persona_name = String::new();
    let mut most_recent_value = 0;

    for cap in user_regex.captures_iter(&content) {
        if let Some(steam_id) = cap.get(1) {
            // If we were processing a previous user, add them to the map
            if !current_steam_id.is_empty() && !current_persona_name.is_empty() {
                users.insert(
                    current_steam_id.clone(),
                    (current_persona_name.clone(), most_recent_value),
                );
            }

            // Start processing a new user
            current_steam_id = steam_id.as_str().to_string();
            current_persona_name = cap.get(2).unwrap().as_str().to_string();
            most_recent_value = 0; // Reset for new user
        } else if let Some(most_recent) = cap.get(3) {
            most_recent_value = most_recent.as_str().parse::<i32>().unwrap_or(0);
        }
    }

    // Don't forget to add the last user being processed
    if !current_steam_id.is_empty() && !current_persona_name.is_empty() {
        users.insert(
            current_steam_id.clone(),
            (current_persona_name.clone(), most_recent_value),
        );
    }
    Ok(users)
}

#[tauri::command]
pub fn get_user_summary_cache(app_handle: tauri::AppHandle) -> Result<Value, String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache");

    let file_path = app_data_dir.join("user_summaries.json");

    if file_path.exists() {
        let mut file = File::open(&file_path)
            .map_err(|e| format!("Failed to open user summaries file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| format!("Failed to read user summaries file: {}", e))?;

        if contents.trim().is_empty() {
            Ok(json!([]))
        } else {
            let parsed: Value = serde_json::from_str(&contents)
                .map_err(|e| format!("Failed to parse user summaries JSON: {}", e))?;
            Ok(parsed)
        }
    } else {
        Ok(json!([]))
    }
}

#[tauri::command]
pub fn delete_user_summary_file(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Get the cache data directory
    let cache_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("cache");

    let file_path = cache_data_dir.join("user_summaries.json");

    if file_path.exists() {
        std::fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete user summaries file: {}", e))?;
    }

    Ok(())
}
