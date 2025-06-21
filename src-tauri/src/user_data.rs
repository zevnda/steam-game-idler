use crate::utils::get_steam_location;
use regex::Regex;
use reqwest::Client;
use serde_json;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

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
pub async fn get_user_summary(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
    // Get the API key from the environment or use the provided one
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
