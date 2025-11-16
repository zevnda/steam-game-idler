use futures::future::join_all;
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
    steam_id: String,
    app_ids: Vec<u32>,
) -> Result<Value, String> {
    let client = Client::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steam_id, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    let mut futures = Vec::with_capacity(app_ids.len());

    for app_id in &app_ids {
        let client = client.clone();
        let cookie_value = cookie_value.clone();
        let steam_id = steam_id.clone();
        let app_id = *app_id;
        println!("Queueing fetch for app_id: {}", app_id);

        futures.push(async move {
            let url = format!(
                "https://steamcommunity.com/profiles/{}/gamecards/{}/?l=english",
                steam_id, app_id
            );
            println!("Fetching card page: {}", url);

            let resp = client
                .get(&url)
                .header("Content-Type", "application/json")
                .header("Cookie", cookie_value)
                .send()
                .await;

            match resp {
                Ok(response) => {
                    let html = response.text().await.unwrap_or_default();
                    println!("Fetched app_id {} HTML length: {}", app_id, html.len());
                    let document = Html::parse_document(&html);
                    let progress_info_bold = Selector::parse(".progress_info_bold").unwrap();

                    if let Some(element) = document.select(&progress_info_bold).next() {
                        let text = element.text().collect::<Vec<_>>().join("");
                        if text.contains("No card drops remaining") {
                            println!("App {}: No card drops remaining", app_id);
                            return Ok((app_id, 0));
                        }

                        let regex = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").unwrap();
                        if let Some(captures) = regex.captures(&text) {
                            let card_drops_remaining = captures[1].parse::<u32>().unwrap_or(0);
                            println!(
                                "App {}: Found {} card drops remaining",
                                app_id, card_drops_remaining
                            );
                            return Ok((app_id, card_drops_remaining));
                        } else {
                            println!("App {}: Card drops data not found", app_id);
                            return Ok((app_id, 0));
                        }
                    } else {
                        println!("App {}: Card drops data not found", app_id);
                        return Ok((app_id, 0));
                    }
                }
                Err(e) => {
                    println!("Failed to fetch app_id {}: {}", app_id, e);
                    Err((app_id, format!("Failed to fetch: {}", e)))
                }
            }
        });
    }

    let results = join_all(futures).await;

    let mut drops = Vec::new();
    let mut errors = Vec::new();

    for result in results {
        match result {
            Ok((app_id, remaining)) => {
                drops.push(json!({ "app_id": app_id, "remaining": remaining }));
            }
            Err((app_id, err)) => {
                errors.push(json!({ "app_id": app_id, "error": err }));
            }
        }
    }

    Ok(json!({
        "drops": drops,
        "errors": errors
    }))
}

#[tauri::command]
pub async fn get_games_with_drops(
    sid: String,
    sls: String,
    sma: Option<String>,
    steamid: String,
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

    // Fetch the first page to determine max pages
    let url_page1 = format!(
        "https://steamcommunity.com/profiles/{}/badges/?l=english&sort=p&p=1",
        steamid
    );
    println!("Fetching first badge page: {}", url_page1);
    let response = client
        .get(&url_page1)
        .header("Cookie", cookie_value.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let html = response.text().await.map_err(|e| e.to_string())?;
    println!("Fetched first page HTML length: {}", html.len());

    // Only parse the first page here to get max_page, then drop the document before any await
    let max_page = {
        let document = Html::parse_document(&html);
        let mut max_page = 1;
        if let Ok(page_links_selector) = Selector::parse(".pageLinks") {
            if let Some(page_links) = document.select(&page_links_selector).next() {
                let pagelink_selector = Selector::parse(".pagelink").unwrap();
                let mut last_page = 1;
                for pagelink in page_links.select(&pagelink_selector) {
                    if let Some(page_num_str) = pagelink.text().next() {
                        if let Ok(page_num) = page_num_str.trim().parse::<usize>() {
                            if page_num > last_page {
                                last_page = page_num;
                            }
                        }
                    }
                }
                max_page = last_page;
            }
        }
        max_page
    };
    println!("Detected max_page: {}", max_page);

    // Prepare all page URLs
    let mut page_futures = Vec::with_capacity(max_page);
    for page in 1..=max_page {
        let url = format!(
            "https://steamcommunity.com/profiles/{}/badges/?l=english&sort=p&p={}",
            steamid, page
        );
        let client = client.clone();
        let cookie_value = cookie_value.clone();
        println!("Queueing fetch for page {}: {}", page, url);
        page_futures.push(async move {
            let resp = client.get(&url).header("Cookie", cookie_value).send().await;
            match resp {
                Ok(r) => {
                    let text = r.text().await.unwrap_or_default();
                    println!("Fetched page {} HTML length: {}", page, text.len());

                    // Parse the HTML for games with drops INSIDE the async block
                    let badge_row_selector = Selector::parse(".badge_row").unwrap();
                    let progress_info_bold_selector =
                        Selector::parse(".progress_info_bold").unwrap();
                    let badge_title_selector = Selector::parse(".badge_title").unwrap();
                    let btn_green_white_innerfade_selector =
                        Selector::parse(".btn_green_white_innerfade").unwrap();

                    let mut games = Vec::new();
                    let document = Html::parse_document(&text);

                    for badge_row in document.select(&badge_row_selector) {
                        if let Some(progress_info) =
                            badge_row.select(&progress_info_bold_selector).next()
                        {
                            let text = progress_info.text().collect::<Vec<_>>().join("");
                            if let Some(captures) =
                                Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining")
                                    .unwrap()
                                    .captures(&text)
                            {
                                let game_name = badge_row
                                    .select(&badge_title_selector)
                                    .next()
                                    .map(|e| {
                                        e.text().collect::<Vec<_>>().join("").trim().to_string()
                                    })
                                    .unwrap_or_default();

                                let app_id = badge_row
                                    .select(&btn_green_white_innerfade_selector)
                                    .next()
                                    .and_then(|e| e.value().attr("href"))
                                    .and_then(|href| href.strip_prefix("steam://run/"))
                                    .unwrap_or_default();

                                if !app_id.is_empty() {
                                    let card_drops_remaining = captures[1].parse().unwrap_or(0);
                                    let game_name =
                                        game_name.replace("View details", "").trim().to_string();
                                    println!(
                                        "Found game with drops: {} (app_id: {}) - remaining: {}",
                                        game_name, app_id, card_drops_remaining
                                    );
                                    games.push(Game {
                                        name: game_name,
                                        id: app_id.to_string(),
                                        remaining: card_drops_remaining,
                                    });
                                }
                            }
                        }
                    }
                    Ok(games)
                }
                Err(e) => {
                    println!("Failed to fetch page {}: {}", page, e);
                    Err(e.to_string())
                }
            }
        });
    }

    // Fetch all pages in parallel
    let results: Vec<Result<Vec<Game>, String>> = join_all(page_futures).await;

    let mut games_with_drops = Vec::new();

    for (page_idx, result) in results.into_iter().enumerate() {
        match result {
            Ok(mut games) => games_with_drops.append(&mut games),
            Err(e) => {
                println!("Skipping page {} due to error: {}", page_idx + 1, e);
                continue;
            }
        }
    }

    Ok(json!({"gamesWithDrops": games_with_drops}))
}
