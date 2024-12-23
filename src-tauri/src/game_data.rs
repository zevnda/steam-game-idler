use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Serialize, Deserialize)]
struct GameInfo {
    appid: String,
    name: String,
}

#[tauri::command]
pub async fn get_games_list(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
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
            Ok(body)
        }
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_recent_games(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
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
            Ok(body)
        }
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_game_details(app_id: String) -> Result<Value, String> {
    let url = format!(
        "https://store.steampowered.com/api/appdetails/?appids={}&l=english",
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

#[tauri::command]
pub async fn get_free_games() -> Result<serde_json::Value, String> {
    let client = Client::new();
    let url = "https://store.steampowered.com/search/?maxprice=free&specials=1";

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
