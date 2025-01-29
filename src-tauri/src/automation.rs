use regex::Regex;
use reqwest::Client;
use scraper::{Html, Selector};
use select::document::Document;
use select::predicate::Class;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::try_join;

#[derive(Debug, Serialize, Deserialize)]
struct Game {
    name: String,
    id: String,
    remaining: u32,
}

#[tauri::command]
pub async fn get_achievement_data(
    steam_id: String,
    app_id: String,
    api_key: Option<String>,
) -> Result<Value, String> {
    // Get the API key from env or use the provided one
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let url_one = format!(
        "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?l=english&key={}&appid={}",
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
    let url_four = format!(
        "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?l=english&key={}&appid={}&steamid={}",
        key, app_id, steam_id
    );

    let client = Client::new();

    let (res_one, res_two, res_three, res_four) = try_join!(
        client.get(&url_one).send(),
        client.get(&url_two).send(),
        client.get(&url_three).send(),
        client.get(&url_four).send()
    )
    .map_err(|err| err.to_string())?;

    // Parse the responses
    let body_one: Value = res_one.json().await.map_err(|e| e.to_string())?;
    let body_two: Value = res_two.json().await.map_err(|e| e.to_string())?;
    let body_three: Value = res_three.json().await.map_err(|e| e.to_string())?;
    let body_four: Value = res_four.json().await.map_err(|e| e.to_string())?;

    // Combine the responses into a single JSON object
    let combined_response = json!({
        "schema": body_one,
        "userStats": body_two,
        "percentages": body_three,
        "userAchievements": body_four,
    });

    Ok(combined_response)
}

#[tauri::command]
pub async fn get_drops_remaining(
    sid: String,
    sls: String,
    sma: Option<String>,
    steamid: String,
    app_id: String,
) -> Result<Value, String> {
    let client = Client::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steamid, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    let response = client
        .get(&format!(
            "https://steamcommunity.com/profiles/{}/gamecards/{}/?l=english",
            steamid, app_id
        ))
        .header("Content-Type", "application/json")
        .header("Cookie", cookie_value)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html);
    let progress_info_bold = Selector::parse(".progress_info_bold").map_err(|e| e.to_string())?;

    // Parse the HTML to find the number of card drops remaining
    if let Some(element) = document.select(&progress_info_bold).next() {
        let text = element.text().collect::<Vec<_>>().join("");
        if text.contains("No card drops remaining") {
            return Ok(serde_json::json!({ "remaining": 0 }));
        }

        let regex =
            Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").map_err(|e| e.to_string())?;
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
pub async fn get_games_with_drops(
    sid: String,
    sls: String,
    sma: Option<String>,
    steamid: String,
) -> Result<Value, String> {
    let client = Client::new();
    let mut page = 1;
    let mut games_with_drops = Vec::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steamid, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    // Loop through the badge pages to find games with card drops remaining
    loop {
        let url = format!(
            "https://steamcommunity.com/profiles/{}/badges/?l=english&sort=p&p={}",
            steamid, page
        );
        let response = client
            .get(&url)
            .header("Cookie", cookie_value.clone())
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let html = response.text().await.map_err(|e| e.to_string())?;
        let document = Document::from(html.as_str());

        // Parse the HTML to find games with card drops remaining
        for badge_row in document.find(Class("badge_row")) {
            if let Some(progress_info) = badge_row.find(Class("progress_info_bold")).next() {
                let text = progress_info.text();
                if let Some(captures) = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining")
                    .unwrap()
                    .captures(&text)
                {
                    let game_name = badge_row
                        .find(Class("badge_title"))
                        .next()
                        .map(|e| e.text().trim().to_string())
                        .unwrap_or_default();

                    let app_id = badge_row
                        .find(Class("btn_green_white_innerfade"))
                        .next()
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

        // Check if there are more pages to process
        if let Some(paging_info) = document.find(Class("profile_paging")).next() {
            let paging_text = paging_info.text();
            if let Some(captures) = Regex::new(r"Showing (\d+)-(\d+) of (\d+)")
                .unwrap()
                .captures(&paging_text)
            {
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
