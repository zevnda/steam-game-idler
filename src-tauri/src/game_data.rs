use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::fs::File;
use std::fs::{create_dir_all, remove_file, OpenOptions};
use std::io::Read;
use std::io::Write;

const APP_FOLDER_NAME: &str = "steam-game-idler";

#[derive(Serialize, Deserialize)]
struct GameInfo {
    appid: String,
    name: String,
}

#[tauri::command]
pub async fn get_games_list(
    steam_id: String,
    api_key: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the API key from the environment or use the provided one
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={}&steamid={}&include_appinfo=true&include_played_free_games=true&include_free_sub=true&skip_unvetted_apps=false&include_extended_appinfo=true",
        key, steam_id
    );

    let client = Client::new();

    // Send the request and handle the response
    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
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
            // Save the response to games_list.json
            let games_file_path = app_specific_dir.join("games_list.json");
            let mut file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(&games_file_path)
                .map_err(|e| format!("Failed to open games list file: {}", e))?;

            let json_string = serde_json::to_string_pretty(&body)
                .map_err(|e| format!("Failed to serialize games list: {}", e))?;
            file.write_all(json_string.as_bytes())
                .map_err(|e| format!("Failed to write games list to file: {}", e))?;

            Ok(body)
        }
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_recent_games(
    steam_id: String,
    api_key: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the API key from the environment or use the provided one
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key={}&steamid={}",
        key, steam_id
    );

    let client = Client::new();

    // Send the request and handle the response
    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
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
            // Save the response to recent_games.json
            let recent_games_file_path = app_specific_dir.join("recent_games.json");
            let mut file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(&recent_games_file_path)
                .map_err(|e| format!("Failed to open recent games file: {}", e))?;

            let json_string = serde_json::to_string_pretty(&body)
                .map_err(|e| format!("Failed to serialize recent games: {}", e))?;
            file.write_all(json_string.as_bytes())
                .map_err(|e| format!("Failed to write recent games to file: {}", e))?;

            Ok(body)
        }
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub fn get_games_list_cache(app_handle: tauri::AppHandle) -> Result<Value, String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    // Get the application-specific directory
    let app_specific_dir = app_data_dir
        .parent()
        .unwrap_or(&app_data_dir)
        .join(APP_FOLDER_NAME);
    // Read games list file
    let games_list = {
        let games_file_path = app_specific_dir.join("games_list.json");
        if games_file_path.exists() {
            let mut file = File::open(&games_file_path)
                .map_err(|e| format!("Failed to open games list file: {}", e))?;
            let mut contents = String::new();
            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read games list file: {}", e))?;
            serde_json::from_str(&contents)
                .map_err(|e| format!("Failed to parse games list JSON: {}", e))?
        } else {
            json!({})
        }
    };

    // Read recent games file
    let recent_games = {
        let recent_games_file_path = app_specific_dir.join("recent_games.json");
        if recent_games_file_path.exists() {
            let mut file = File::open(&recent_games_file_path)
                .map_err(|e| format!("Failed to open recent games file: {}", e))?;
            let mut contents = String::new();
            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read recent games file: {}", e))?;
            serde_json::from_str(&contents)
                .map_err(|e| format!("Failed to parse recent games JSON: {}", e))?
        } else {
            json!({})
        }
    };

    Ok(json!({
        "games_list": games_list,
        "recent_games": recent_games
    }))
}

#[tauri::command]
pub async fn get_free_games() -> Result<serde_json::Value, String> {
    let client = Client::new();
    let url = "https://store.steampowered.com/search/?l=english&maxprice=free&specials=1";

    let response = client.get(url).send().await.map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html);

    let a_selector = Selector::parse("a.search_result_row").unwrap();
    let title_selector = Selector::parse("span.title").unwrap();

    let mut free_games = Vec::new();

    // Parse the HTML to find free games
    for element in document.select(&a_selector) {
        if let Some(app_id) = element.value().attr("data-ds-appid") {
            if let Some(title_element) = element.select(&title_selector).next() {
                let name = title_element.text().collect::<String>();
                free_games.push(GameInfo {
                    appid: app_id.to_string(),
                    name: name.trim().to_string(),
                });
            }
        }
    }

    Ok(json!({ "games": free_games }))
}

#[tauri::command]
pub fn delete_games_list_files(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Get the application data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    // Get the application-specific directory
    let app_specific_dir = app_data_dir
        .parent()
        .unwrap_or(&app_data_dir)
        .join(APP_FOLDER_NAME);
    // Delete the games list file
    let games_file_path = app_specific_dir.join("games_list.json");
    if games_file_path.exists() {
        remove_file(&games_file_path)
            .map_err(|e| format!("Failed to delete games list file: {}", e))?;
    }
    // Delete the recent games file
    let recent_games_file_path = app_specific_dir.join("recent_games.json");
    if recent_games_file_path.exists() {
        remove_file(&recent_games_file_path)
            .map_err(|e| format!("Failed to delete recent games file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_game_details(app_id: String) -> Result<Value, String> {
    let url = format!(
        "https://store.steampowered.com/api/appdetails/?l=english&appids={}",
        app_id
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
