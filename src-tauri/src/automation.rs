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
    app_id: u32,
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

    let response = client
        .get(&format!(
            "https://steamcommunity.com/profiles/{}/gamecards/{}/?l=english",
            steam_id, app_id
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
    // Debug information collection
    let mut debug_info = Vec::new();
    let mut raw_html_samples = Vec::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steamid, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    // Loop through the badge pages to find games with card drops remaining
    let mut badge13_found_on_page = 0;
    let mut stopping_page = 0;
    let mut stopping_reason = String::new();

    loop {
        let url = format!(
            "https://steamcommunity.com/profiles/{}/badges/?l=english&sort=p&p={}",
            steamid, page
        );

        // Debug: Record page request
        let mut page_debug = json!({
            "page": page,
            "url": url,
            "time_started": chrono::Utc::now().to_rfc3339(),
        });

        // Start the request for this page
        let response_result = client
            .get(&url)
            .header("Cookie", cookie_value.clone())
            .send()
            .await;

        // Debug response status
        if let Err(e) = &response_result {
            page_debug["request_error"] = json!(e.to_string());
            debug_info.push(page_debug);
            return Ok(json!({
                "gamesWithDrops": games_with_drops,
                "debug_info": debug_info,
                "error": format!("Request error on page {}: {}", page, e)
            }));
        }

        let response = response_result.unwrap();
        page_debug["status_code"] = json!(response.status().as_u16());
        page_debug["headers"] = json!(format!("{:?}", response.headers()));

        let html = match response.text().await {
            Ok(h) => h,
            Err(e) => {
                page_debug["text_error"] = json!(e.to_string());
                debug_info.push(page_debug);
                return Ok(json!({
                    "gamesWithDrops": games_with_drops,
                    "debug_info": debug_info,
                    "error": format!("HTML parsing error on page {}: {}", page, e)
                }));
            }
        };

        // Store a sample of HTML for debugging (first 500 and last 500 characters)
        if html.len() > 1000 {
            raw_html_samples.push(json!({
                "page": page,
                "start": &html[..500],
                "end": &html[html.len() - 500..],
                "length": html.len()
            }));
        } else if !html.is_empty() {
            raw_html_samples.push(json!({
                "page": page,
                "full_html": &html,
                "length": html.len()
            }));
        } else {
            raw_html_samples.push(json!({
                "page": page,
                "error": "Empty HTML response"
            }));
        }

        page_debug["html_size"] = json!(html.len());
        let document = Html::parse_document(&html);

        // Check for signs of valid/invalid response
        page_debug["has_html_tag"] = json!(html.contains("<html"));
        page_debug["has_body_tag"] = json!(html.contains("<body"));
        page_debug["has_badge_text"] = json!(html.contains("badge"));
        page_debug["has_error_text"] = json!(html.contains("error") || html.contains("Error"));
        page_debug["has_login_text"] = json!(html.contains("sign in") || html.contains("login"));

        let badge_row_selector = Selector::parse(".badge_row").unwrap();
        let progress_info_bold_selector = Selector::parse(".progress_info_bold").unwrap();
        let badge_title_selector = Selector::parse(".badge_title").unwrap();
        let btn_green_white_innerfade_selector =
            Selector::parse(".btn_green_white_innerfade").unwrap();

        // Debug: Count badge rows found
        let badge_rows_count = document.select(&badge_row_selector).count();
        page_debug["badge_rows_count"] = json!(badge_rows_count);
        let mut page_games_found = Vec::new();
        let mut rows_debug = Vec::new();

        // Parse the HTML to find games with card drops remaining
        for (row_index, badge_row) in document.select(&badge_row_selector).enumerate() {
            let row_html = badge_row.html();
            let mut row_debug = json!({
                "row_index": row_index,
                "has_progress_info": false,
                "row_html_sample": if row_html.len() > 200 {
                    format!("{}...{}", &row_html[..100], &row_html[row_html.len()-100..])
                } else {
                    row_html
                }
            });

            if let Some(progress_info) = badge_row.select(&progress_info_bold_selector).next() {
                let text = progress_info.text().collect::<Vec<_>>().join("");
                row_debug["has_progress_info"] = json!(true);
                row_debug["progress_info_text"] = json!(text);
                row_debug["has_drops"] = json!(false);
                row_debug["game_name"] = json!("");
                row_debug["app_id"] = json!("");

                // Check if text matches card drop pattern
                let drop_regex = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").unwrap();
                row_debug["matches_drop_regex"] = json!(drop_regex.is_match(&text));

                if let Some(captures) = drop_regex.captures(&text) {
                    let game_name_element = badge_row.select(&badge_title_selector).next();
                    row_debug["has_game_title"] = json!(game_name_element.is_some());

                    let game_name = game_name_element
                        .map(|e| {
                            let title_text = e.text().collect::<Vec<_>>().join("");
                            row_debug["raw_game_title"] = json!(title_text.trim());
                            title_text.trim().to_string()
                        })
                        .unwrap_or_default();

                    let button_element =
                        badge_row.select(&btn_green_white_innerfade_selector).next();
                    row_debug["has_button"] = json!(button_element.is_some());

                    let app_id = button_element
                        .and_then(|e| {
                            let href = e.value().attr("href");
                            row_debug["button_href"] = json!(href);
                            href.and_then(|h| h.strip_prefix("steam://run/"))
                        })
                        .unwrap_or_default();

                    row_debug["has_drops"] = json!(true);
                    row_debug["game_name"] = json!(game_name);
                    row_debug["app_id"] = json!(app_id);
                    row_debug["drops_count"] = json!(captures[1].to_string());

                    if !app_id.is_empty() {
                        let card_drops_remaining = captures[1].parse().unwrap_or(0);
                        let game_name = game_name.replace("View details", "").trim().to_string();
                        games_with_drops.push(Game {
                            name: game_name.clone(),
                            id: app_id.to_string(),
                            remaining: card_drops_remaining,
                        });

                        // Debug: Track games found on this page
                        page_games_found.push(json!({
                            "name": game_name,
                            "id": app_id,
                            "remaining": card_drops_remaining
                        }));
                    }
                }
            } else {
                row_debug["has_progress_info"] = json!(false);
            }

            rows_debug.push(row_debug);
        }

        page_debug["rows_debug"] = json!(rows_debug);
        page_debug["games_found"] = json!(page_games_found);
        page_debug["games_count"] = json!(page_games_found.len());

        // Check if the badge 13 link is on this page - if so, we can stop after we've processed the page
        let badge13_link = "/badges/13";
        let should_stop = html.contains(&badge13_link);
        page_debug["badge13_found"] = json!(should_stop);

        // Record which page the badge 13 was found on
        if should_stop && badge13_found_on_page == 0 {
            badge13_found_on_page = page;
        }

        page_debug["time_completed"] = json!(chrono::Utc::now().to_rfc3339());

        // Check if there are more pages to process
        let profile_paging_selector = Selector::parse(".profile_paging").unwrap();
        let paging_elements = document.select(&profile_paging_selector).count();
        let mut paging_debug = json!({
            "has_paging_element": paging_elements > 0,
            "paging_elements_count": paging_elements,
            "paging_text": "",
            "reached_end": false
        });

        if let Some(paging_info) = document.select(&profile_paging_selector).next() {
            let paging_html = paging_info.html();
            let paging_text = paging_info.text().collect::<Vec<_>>().join("");
            paging_debug["paging_html"] = json!(paging_html);
            paging_debug["paging_text"] = json!(paging_text);

            // Check for "next" button
            let next_page_exists = paging_html.contains(">&nbsp;")
                || paging_html.contains(">")
                || paging_html.contains("nextpage");
            paging_debug["has_next_button"] = json!(next_page_exists);

            // Check for pagination format
            let pagination_regex = Regex::new(r"Showing (\d+)-(\d+) of (\d+)").unwrap();
            let pagination_match = pagination_regex.is_match(&paging_text);
            paging_debug["matches_pagination_regex"] = json!(pagination_match);

            if let Some(captures) = pagination_regex.captures(&paging_text) {
                paging_debug["captures"] = json!({
                    "range_start": captures[1].to_string(),
                    "range_end": captures[2].to_string(),
                    "total": captures[3].to_string(),
                    "current_page": page,
                    "calculated_total_pages": (captures[3].parse::<f64>().unwrap_or(0.0) / 150.0).ceil() as u32
                });

                if captures[2] == captures[3] {
                    paging_debug["reached_end"] = json!(true);
                    stopping_page = page;
                    stopping_reason = "Reached end of pagination".to_string();
                    page_debug["stopping_reason"] = json!(stopping_reason);
                    debug_info.push(page_debug);
                    break;
                }
            } else {
                paging_debug["reached_end"] = json!(true);
                stopping_page = page;
                stopping_reason = "No pagination format match".to_string();
                page_debug["stopping_reason"] = json!(stopping_reason);
                debug_info.push(page_debug);
                break;
            }
        } else {
            paging_debug["reached_end"] = json!(true);
            stopping_page = page;
            stopping_reason = "No pagination element found".to_string();
            page_debug["stopping_reason"] = json!(stopping_reason);
            debug_info.push(page_debug);
            break;
        }

        page_debug["pagination"] = paging_debug;

        // If we found the badge 13 link on this page, we're done
        if should_stop {
            stopping_page = page;
            stopping_reason = "Badge 13 link found".to_string();
            page_debug["stopping_reason"] = json!(stopping_reason);
            debug_info.push(page_debug);
            break;
        }

        debug_info.push(page_debug);
        page += 1;

        // Safety check to avoid infinite loops
        if page > 20 {
            stopping_page = page;
            stopping_reason = "Exceeded maximum page count".to_string();
            return Ok(json!({
                "gamesWithDrops": games_with_drops,
                "debug_info": debug_info,
                "raw_html_samples": raw_html_samples,
                "warning": "Exceeded maximum page count (20), stopping to prevent infinite loop",
                "badge13_found_on_page": badge13_found_on_page,
                "stopping_page": stopping_page,
                "stopping_reason": stopping_reason
            }));
        }
    }

    Ok(json!({
        "gamesWithDrops": games_with_drops,
        "debug_info": debug_info,
        "raw_html_samples": raw_html_samples,
        "total_pages_processed": page,
        "total_games_found": games_with_drops.len(),
        "badge13_found_on_page": badge13_found_on_page,
        "stopping_page": stopping_page,
        "stopping_reason": stopping_reason
    }))
}
