use crate::utils::{get_steam_location, parse_login_users};
use reqwest::Client;
use serde_json;
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;

#[tauri::command]
// Get Steam users
pub async fn get_users() -> Result<String, String> {
    let steam_loc = get_steam_location().await.map_err(|e| e.to_string())?;
    let steam_loc_path = PathBuf::from(steam_loc);

    // Parse the loginusers.vdf file
    match parse_login_users(&steam_loc_path) {
        Ok(users) => {
            if !users.is_empty() {
                // Create a list of users with personaName and steamId
                let user_list: Vec<HashMap<&str, &str>> = users
                    .iter()
                    .map(|(key, value)| {
                        let mut user = HashMap::new();
                        user.insert("personaName", value.as_str());
                        user.insert("steamId", key.as_str());
                        user
                    })
                    .collect();

                // Convert the user list to JSON and return it
                let users_json = serde_json::to_string(&user_list).map_err(|e| e.to_string())?;
                return Ok(users_json);
            }
            Err("No users found".to_string())
        }
        Err(e) => Err(format!("Error parsing loginusers file: {}", e)),
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
