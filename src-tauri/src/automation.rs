use regex::Regex;
use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Serialize, Deserialize)]
struct Game {
    name: String,
    id: String,
    remaining: u32,
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
            return Ok(json!({ "remaining": 0 }));
        }

        let regex =
            Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").map_err(|e| e.to_string())?;
        if let Some(captures) = regex.captures(&text) {
            let card_drops_remaining = captures[1].parse::<i32>().map_err(|e| e.to_string())?;
            return Ok(json!({"remaining": card_drops_remaining}));
        } else {
            return Ok(json!({"error": "Card drops data not found"}));
        }
    } else {
        return Ok(json!({"error": "Card drops data not found"}));
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
        let document = Html::parse_document(&html);

        let badge_row_selector = Selector::parse(".badge_row").unwrap();
        let progress_info_bold_selector = Selector::parse(".progress_info_bold").unwrap();
        let badge_title_selector = Selector::parse(".badge_title").unwrap();
        let btn_green_white_innerfade_selector =
            Selector::parse(".btn_green_white_innerfade").unwrap();

        // Parse the HTML to find games with card drops remaining
        for badge_row in document.select(&badge_row_selector) {
            if let Some(progress_info) = badge_row.select(&progress_info_bold_selector).next() {
                let text = progress_info.text().collect::<Vec<_>>().join("");
                if let Some(captures) = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining")
                    .unwrap()
                    .captures(&text)
                {
                    let game_name = badge_row
                        .select(&badge_title_selector)
                        .next()
                        .map(|e| e.text().collect::<Vec<_>>().join("").trim().to_string())
                        .unwrap_or_default();

                    let app_id = badge_row
                        .select(&btn_green_white_innerfade_selector)
                        .next()
                        .and_then(|e| e.value().attr("href"))
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
        let profile_paging_selector = Selector::parse(".profile_paging").unwrap();
        if let Some(paging_info) = document.select(&profile_paging_selector).next() {
            let paging_text = paging_info.text().collect::<Vec<_>>().join("");
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

    Ok(json!({"gamesWithDrops": games_with_drops}))
}
