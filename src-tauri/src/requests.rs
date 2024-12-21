use reqwest::Client;
use serde_json::{json, Value};
use serde::{Deserialize, Serialize};
use tokio::try_join;
use regex::Regex;
use scraper::{Html, Selector};
use select::document::Document;
use select::predicate::{Class};

#[derive(Debug, Serialize, Deserialize)]
struct Game {
    name: String,
    id: String,
    remaining: u32,
}

#[derive(Serialize, Deserialize)]
struct GameInfo {
    appid: String,
    name: String,
}

#[tauri::command]
pub async fn get_user_summary(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={}&steamids={}",
        key, steam_id
    );

    let client = Client::new();

    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(body)
        },
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_games_list(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={}&steamid={}&include_appinfo=true&include_played_free_games=true&include_free_sub=true&skip_unvetted_apps=false&include_extended_appinfo=true",
        key, steam_id
    );

    let client = Client::new();

    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(body)
        },
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_recent_games(steam_id: String, api_key: Option<String>) -> Result<Value, String> {
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key={}&steamid={}",
        key, steam_id
    );

    let client = Client::new();

    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(body)
        },
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_game_details(app_id: String) -> Result<Value, String> { 
    let url = format!(
        "https://store.steampowered.com/api/appdetails/?appids={}&l=english", app_id
    );

    let client = Client::new();

    match client.get(&url).send().await {
        Ok(response) => {
            let body: Value = response.json().await.map_err(|e| e.to_string())?;
            Ok(body)
        },
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn get_achievement_data(steam_id: String, app_id: String, api_key: Option<String>) -> Result<Value, String> {
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url_one = format!(
        "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={}&appid={}",
        key, app_id
    );
    let url_two = format!(
        "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key={}&appid={}&steamid={}",
        key, app_id, steam_id
    );
    let url_three = format!(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid={}",
        app_id
    );

    let client = Client::new();

    let (res_one, res_two, res_three) = try_join!(
        client.get(&url_one).send(),
        client.get(&url_two).send(),
        client.get(&url_three).send()
    ).map_err(|err| err.to_string())?;

    let body_one: Value = res_one.json().await.map_err(|e| e.to_string())?;
    let body_two: Value = res_two.json().await.map_err(|e| e.to_string())?;
    let body_three: Value = res_three.json().await.map_err(|e| e.to_string())?;

    let combined_response = json!({
        "schema": body_one,
        "userStats": body_two,
        "percentages": body_three,
    });

    Ok(combined_response)
}

#[tauri::command]
pub async fn get_achievement_unlocker_data(steam_id: String, app_id: String, api_key: Option<String>) -> Result<Value, String> {
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url_one = format!(
        "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={}&appid={}",
        key, app_id
    );
    let url_two = format!(
        "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key={}&appid={}&steamid={}",
        key, app_id, steam_id
    );
    let url_three = format!(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid={}",
        app_id
    );

    let client = Client::new();

    let (res_one, res_two, res_three) = try_join!(
        client.get(&url_one).send(),
        client.get(&url_two).send(),
        client.get(&url_three).send()
    ).map_err(|err| err.to_string())?;

    let body_one: Value = res_one.json().await.map_err(|e| e.to_string())?;
    let body_two: Value = res_two.json().await.map_err(|e| e.to_string())?;
    let body_three: Value = res_three.json().await.map_err(|e| e.to_string())?;

    let combined_response = json!({
        "schema": body_one,
        "userAchievements": body_two,
        "percentages": body_three,
    });

    Ok(combined_response)
}

#[tauri::command]
pub async fn validate_session(sid: String, sls: String, sma: Option<String>, steamid: String) -> Result<Value, String> {
    let client = Client::new();

    let cookie_value = match sma {
        Some(sma_val) => format!("sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}", sid, sls, sma_val, steamid, sma_val),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    let response = client
        .get("https://steamcommunity.com/")
        .header("Content-Type", "application/json")
        .header("Cookie", cookie_value)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;
    let regex = Regex::new(r"Sign out").map_err(|e| e.to_string())?;
    let regex_two = Regex::new(r#"<a\s+href="https://steamcommunity\.com/(id|profiles)/[^"]*"\s+data-miniprofile="\d+">([^<]+)</a>"#)
        .map_err(|e| e.to_string())?;

    if let Some(_m) = regex.find(&html) {
        if let Some(captures) = regex_two.captures(&html) {
            Ok(serde_json::json!({ "user": captures[2].to_string() }))
        } else {
            Ok(serde_json::json!({ "error": "Not logged in" }))
        }
    } else {
        Ok(serde_json::json!({ "error": "Not logged in" }))
    }
}

#[tauri::command]
pub async fn get_drops_remaining(sid: String, sls: String, steam_id: String, app_id: String) -> Result<Value, String> {
    let client = Client::new();
    let response = client
        .get(&format!("https://steamcommunity.com/profiles/{}/gamecards/{}", steam_id, app_id))
        .header("Content-Type", "application/json")
        .header("Cookie", format!("sessionid={}; steamLoginSecure={}", sid, sls))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html);
    let progress_info_bold = Selector::parse(".progress_info_bold").map_err(|e| e.to_string())?;

    if let Some(element) = document.select(&progress_info_bold).next() {
        let text = element.text().collect::<Vec<_>>().join("");
        if text.contains("No card drops remaining") {
            return Ok(serde_json::json!({ "remaining": 0 }));
        }

        let regex = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").map_err(|e| e.to_string())?;
        if let Some(captures) = regex.captures(&text) {
            let card_drops_remaining = captures[1].parse::<i32>().map_err(|e| e.to_string())?;
            return Ok(serde_json::json!({ "remaining": card_drops_remaining }));
        } else {
            return Ok(serde_json::json!({ "error": "Card drops data not found" }));
        }
    } else {
        return Ok(serde_json::json!({ "error": "Card drops data not found" }));
    }
}

#[tauri::command]
pub async fn get_games_with_drops(sid: String, sls: String, steam_id: String) -> Result<Value, String> {
    let client = Client::new();
    let mut page = 1;
    let mut games_with_drops = Vec::new();

    loop {
        let url = format!("https://steamcommunity.com/profiles/{}/badges/?sort=p&p={}", steam_id, page);
        let response = client.get(&url)
            .header("Cookie", format!("sessionid={}; steamLoginSecure={}", sid, sls))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let html = response.text().await.map_err(|e| e.to_string())?; 
        let document = Document::from(html.as_str());

        for badge_row in document.find(Class("badge_row")) {
            if let Some(progress_info) = badge_row.find(Class("progress_info_bold")).next() {
                let text = progress_info.text();
                if let Some(captures) = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").unwrap().captures(&text) {
                    let game_name = badge_row.find(Class("badge_title")).next()
                        .map(|e| e.text().trim().to_string())
                        .unwrap_or_default();

                    let app_id = badge_row.find(Class("btn_green_white_innerfade")).next()
                        .and_then(|e| e.attr("href"))
                        .and_then(|href| href.strip_prefix("steam://run/"))
                        .unwrap_or_default();

                    if !app_id.is_empty() {
                        let card_drops_remaining = captures[1].parse().unwrap_or(0);
                        let game_name = game_name.replace("View details", "").trim().to_string();
                        games_with_drops.push(Game {
                            name: game_name,
                            id: app_id.to_string(),
                            remaining: card_drops_remaining,
                        });
                    }
                }
            }
        }

        if let Some(paging_info) = document.find(Class("profile_paging")).next() {
            let paging_text = paging_info.text();
            if let Some(captures) = Regex::new(r"Showing (\d+)-(\d+) of (\d+)").unwrap().captures(&paging_text) {
                if captures[2] == captures[3] {
                    break;
                }
            } else {
                break;
            }
        } else {
            break;
        }

        page += 1;
    }

    Ok(serde_json::json!({ "gamesWithDrops": games_with_drops }))
}

#[tauri::command]
pub async fn get_free_games() -> Result<serde_json::Value, String> {
    let client = Client::new();
    let url = "https://store.steampowered.com/search/?maxprice=free&specials=1";

    let response = client.get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html);

    let a_selector = Selector::parse("a.search_result_row").unwrap();
    let title_selector = Selector::parse("span.title").unwrap();

    let mut free_games = Vec::new();

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