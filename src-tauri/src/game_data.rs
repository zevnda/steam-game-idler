use crate::utils::{get_cache_dir, get_lib_path};
use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs::File;
use std::fs::{create_dir_all, remove_dir_all, remove_file, OpenOptions};
use std::io::Read;
use std::io::Write;
use std::os::windows::process::CommandExt;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
struct GameInfo {
    appid: String,
    name: String,
}

#[derive(Serialize, Deserialize)]
struct GameData {
    appid: u64,
    name: String,
    playtime_forever: u64,
}

#[tauri::command]
pub async fn get_games_list(
    steam_id: String,
    api_key: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Set file paths
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());
    create_dir_all(&app_data_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;

    let temp_games_file = app_data_dir.join("temp_owned_games.json");
    let temp_games_file_str = temp_games_file.to_string_lossy().to_string();

    // Create an empty temp file to write to
    let exe_path = get_lib_path()?;
    let output = std::process::Command::new(exe_path)
        .args(&["check_ownership", &temp_games_file_str])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to execute check_ownership: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    let error_str = String::from_utf8_lossy(&output.stderr);

    let cs_result: Value = serde_json::from_str(&output_str).map_err(|e| {
        format!(
            "Failed to parse output: {}\nSTDOUT: {}\nSTDERR: {}",
            e, output_str, error_str
        )
    })?;

    if !cs_result["success"].as_bool().unwrap_or(false) {
        return Err(format!(
            "Returned error: {}\n{}",
            cs_result["error"].as_str().unwrap_or("Unknown error"),
            cs_result["suggestion"].as_str().unwrap_or("")
        ));
    }

    // Read the temp games file
    let mut file = File::open(&temp_games_file)
        .map_err(|e| format!("Failed to open temp games file: {}", e))?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read temp games file: {}", e))?;
    let cs_games_data: Value = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse temp games JSON: {}", e))?;

    let cs_games = cs_games_data["games"]
        .as_array()
        .ok_or_else(|| "Did not return games array".to_string())?;

    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());

    // Fetch owned games from the Steam Web API
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={}&steamid={}&include_appinfo=true&include_played_free_games=true&include_free_sub=true&skip_unvetted_apps=false&include_extended_appinfo=false",
        key, steam_id
    );

    let client = Client::new();
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let web_api_body: Value = response.json().await.map_err(|e| e.to_string())?;

    let mut playtime_map: HashMap<u64, u64> = HashMap::new();
    if let Some(web_games) = web_api_body["response"]["games"].as_array() {
        for game in web_games {
            if let (Some(appid), Some(playtime)) =
                (game["appid"].as_u64(), game["playtime_forever"].as_u64())
            {
                playtime_map.insert(appid, playtime);
            }
        }
    }

    // Merge both lists filling in playtime from the web API
    let mut merged_games: Vec<GameData> = Vec::new();
    for game in cs_games {
        if let (Some(appid), Some(name)) = (game["appid"].as_u64(), game["name"].as_str()) {
            let playtime_forever = playtime_map.get(&appid).copied().unwrap_or(0);
            merged_games.push(GameData {
                appid,
                name: name.to_string(),
                playtime_forever,
            });
        }
    }

    // Add any games from the web API that weren't in the original list
    let cs_appids: std::collections::HashSet<u64> = merged_games.iter().map(|g| g.appid).collect();
    if let Some(web_games) = web_api_body["response"]["games"].as_array() {
        for game in web_games {
            if let (Some(appid), Some(name), Some(playtime)) = (
                game["appid"].as_u64(),
                game["name"].as_str(),
                game["playtime_forever"].as_u64(),
            ) {
                if !cs_appids.contains(&appid) {
                    merged_games.push(GameData {
                        appid,
                        name: name.to_string(),
                        playtime_forever: playtime,
                    });
                }
            }
        }
    }

    let game_data = json!({
        "games_list": merged_games
    });

    let file_name = format!("games_list.json");
    let games_file_path = app_data_dir.join(file_name);
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&games_file_path)
        .map_err(|e| format!("Failed to open games list file: {}", e))?;

    let json_string = serde_json::to_string_pretty(&game_data)
        .map_err(|e| format!("Failed to serialize games list: {}", e))?;
    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write games list to file: {}", e))?;

    let _ = std::fs::remove_file(&temp_games_file);

    Ok(game_data)
}

#[tauri::command]
pub async fn get_recent_games(
    steam_id: String,
    api_key: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    // Get the API key from the envor use the provided one
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

            // Process the response to extract only needed fields
            let filtered_data = filter_game_data(&body)?;

            let game_data = json!({
                "games_list": filtered_data
            });

            let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());
            create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app directory: {}", e))?;

            // Save the filtered response to recent_games.json
            let file_name = format!("recent_games.json");
            let recent_games_file_path = app_data_dir.join(file_name);
            let mut file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(&recent_games_file_path)
                .map_err(|e| format!("Failed to open recent games file: {}", e))?;

            let json_string = serde_json::to_string_pretty(&game_data)
                .map_err(|e| format!("Failed to serialize recent games: {}", e))?;
            file.write_all(json_string.as_bytes())
                .map_err(|e| format!("Failed to write recent games to file: {}", e))?;

            Ok(game_data)
        }
        Err(err) => Err(err.to_string()),
    }
}

// Helper function to filter game data
fn filter_game_data(data: &Value) -> Result<Value, String> {
    let games = match &data["response"]["games"] {
        Value::Array(games) => games,
        _ => return Ok(json!([])),
    };

    let filtered_games: Vec<GameData> = games
        .iter()
        .filter_map(|game| {
            let appid = game["appid"].as_u64()?;
            let name = game["name"].as_str()?.to_string();
            let playtime_forever = game["playtime_forever"].as_u64().unwrap_or(0);

            Some(GameData {
                appid,
                name,
                playtime_forever,
            })
        })
        .collect();

    Ok(json!(filtered_games))
}

#[tauri::command]
pub fn get_games_list_cache(
    steam_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());

    // Read games list file
    let games_list = {
        let file_name = format!("games_list.json");
        let games_file_path = app_data_dir.join(file_name);
        if games_file_path.exists() {
            let mut file = File::open(&games_file_path)
                .map_err(|e| format!("Failed to open games list file: {}", e))?;
            let mut contents = String::new();
            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read games list file: {}", e))?;
            let parsed: Value = serde_json::from_str(&contents)
                .map_err(|e| format!("Failed to parse games list JSON: {}", e))?;

            // Extract the games_list array from the parsed object
            parsed.get("games_list").cloned().unwrap_or(json!({}))
        } else {
            json!({})
        }
    };

    // Read recent games file
    let recent_games = {
        let file_name = format!("recent_games.json");
        let recent_games_file_path = app_data_dir.join(file_name);
        if recent_games_file_path.exists() {
            let mut file = File::open(&recent_games_file_path)
                .map_err(|e| format!("Failed to open recent games file: {}", e))?;
            let mut contents = String::new();
            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read recent games file: {}", e))?;
            let parsed: Value = serde_json::from_str(&contents)
                .map_err(|e| format!("Failed to parse recent games JSON: {}", e))?;

            // Extract the games_list array from the parsed object
            parsed.get("games_list").cloned().unwrap_or(json!({}))
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
pub fn delete_user_games_list_files(
    steam_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let games_list_file_name = format!("games_list.json");
    let recent_games_file_name = format!("recent_games.json");
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());
    // Delete the games list file
    let games_file_path = app_data_dir.join(games_list_file_name);
    if games_file_path.exists() {
        remove_file(&games_file_path)
            .map_err(|e| format!("Failed to delete games list file: {}", e))?;
    }
    // Delete the recent games file
    let recent_games_file_path = app_data_dir.join(recent_games_file_name);
    if recent_games_file_path.exists() {
        remove_file(&recent_games_file_path)
            .map_err(|e| format!("Failed to delete recent games file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_all_cache_files(app_handle: tauri::AppHandle) -> Result<(), String> {
    let cache_data_dir = get_cache_dir(&app_handle)?;
    // Delete the cache directory
    match remove_dir_all(&cache_data_dir) {
        Ok(_) => println!("Successfully deleted directory: {:?}", cache_data_dir),
        Err(e) => println!(
            "Failed to delete directory: {:?}, Error: {}",
            cache_data_dir, e
        ),
    }

    Ok(())
}

#[tauri::command]
pub async fn get_free_games() -> Result<serde_json::Value, String> {
    let client = Client::new();
    let url =
        "https://store.steampowered.com/search/?l=english&maxprice=free&specials=1&category1=998";

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

// Redeem a free game by opening the Steam store page and clicking the "Add to Library" button if available
#[tauri::command]
pub async fn redeem_free_game(
    app_handle: tauri::AppHandle,
    app_id: String,
) -> Result<Value, String> {
    use std::time::Duration;

    // Construct the URL for the game page
    let url = format!("https://store.steampowered.com/app/{}", app_id);

    // Create a hidden window for the game page
    let window = tauri::webview::WebviewWindowBuilder::new(
        &app_handle,
        &format!("steam-redeem-{}", app_id),
        tauri::WebviewUrl::External(url.parse().unwrap()),
    )
    .title(&format!("Redeeming Free Game {}", app_id))
    .inner_size(0.0, 0.0)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    // Wait a moment for the page to load
    tokio::time::sleep(Duration::from_millis(5000)).await;

    // Poll for the "Add to Account" button up to 5 times, every second
    for _ in 0..5 {
        if let Some(webview) = window.get_webview(&format!("steam-redeem-{}", app_id)) {
            // Execute JavaScript to check for the button and click it
            let js_check = r#"
                (function() {
                    console.log('=== Debug: Starting button search ===');
                    
                    // Check for btn_addtocart div
                    const cartDiv = document.querySelector('.btn_addtocart');
                    console.log('btn_addtocart div found:', !!cartDiv);
                    if (cartDiv) {
                        console.log('btn_addtocart HTML:', cartDiv.innerHTML);
                    }
                    
                    // Try different selectors
                    const btn1 = document.querySelector('.btn_addtocart a');
                    console.log('Selector ".btn_addtocart a" found:', !!btn1);
                    
                    const btn2 = document.querySelector('.btn_addtocart a.btn_green_steamui');
                    console.log('Selector ".btn_addtocart a.btn_green_steamui" found:', !!btn2);
                    
                    const btn3 = document.querySelector('a.btn_green_steamui[href*="addToCart"]');
                    console.log('Selector "a.btn_green_steamui[href*="addToCart"]" found:', !!btn3);
                    
                    const btn4 = document.querySelector('.btn_addtocart a[href*="addToCart"]');
                    console.log('Selector ".btn_addtocart a[href*="addToCart"]" found:', !!btn4);
                    
                    // Use the most specific selector
                    const btn = document.querySelector('.btn_addtocart a[href*="addToCart"]');
                    if (!btn) {
                        console.error('Button not found with any selector');
                        throw new Error('Button not found');
                    }
                    
                    console.log('Found button:', btn);
                    const href = btn.getAttribute('href');
                    console.log('Button href:', href);
                    
                    const match = href.match(/addToCart\(\s*(\d+)\s*\)/);
                    if (!match) {
                        console.error('No match for product ID in href:', href);
                        throw new Error('No match for product ID');
                    }
                    
                    const productId = match[1];
                    console.log('Found product ID:', productId);
                    
                    // Call the addToCart function
                    console.log('Calling addToCart with product ID:', productId);
                    addToCart(productId);
                    
                    return true;
                })();
            "#;

            match webview.eval(js_check) {
                Ok(_) => {
                    // Button found and clicked, wait a bit then close
                    tokio::time::sleep(Duration::from_millis(500)).await;
                    let _ = window.close();
                    return Ok(serde_json::json!({
                        "success": true,
                        "message": "Free game redeemed successfully"
                    }));
                }
                Err(e) => {
                    // JS execution failed (button not found), continue polling
                    println!("JS execution error: {}", e);
                }
            }
        } else {
            // Window or webview no longer exists
            return Ok(serde_json::json!({
                "success": false,
                "message": "Redeem window closed unexpectedly"
            }));
        }

        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    // If we reach here, the button was not found
    let _ = window.close();
    Ok(serde_json::json!({
        "success": false,
        "message": "Could not find redeem button or game is not free"
    }))
}
