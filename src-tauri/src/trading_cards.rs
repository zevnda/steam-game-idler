use crate::utils::get_cache_dir;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs::File;
use std::fs::{create_dir_all, remove_file, OpenOptions};
use std::io::Read;
use std::io::Write;

#[tauri::command]
pub async fn get_trading_cards(
    sid: String,
    sls: String,
    sma: Option<String>,
    steam_id: String,
    app_handle: tauri::AppHandle,
    api_key: Option<String>,
) -> Result<Value, String> {
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            // Allow up to 10 redirects
            if attempt.previous().len() > 10 {
                attempt.stop()
            } else {
                attempt.follow()
            }
        }))
        .build()
        .map_err(|e| e.to_string())?;

    let mut trading_cards = Vec::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steam_id, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    // Pagination: fetch all inventory pages
    let mut all_assets = Vec::new();
    let mut all_descriptions = Vec::new();
    let mut start_assetid: Option<String> = None;
    let mut total_inventory_count = 0;
    loop {
        let mut inventory_url = format!(
            "https://steamcommunity.com/inventory/{}/753/6?l=english&count=2500",
            steam_id
        );
        if let Some(ref start) = start_assetid {
            inventory_url.push_str(&format!("&start_assetid={}", start));
        }

        let response = client
            .get(&inventory_url)
            .header("Cookie", &cookie_value)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to fetch inventory: HTTP {}",
                response.status()
            ));
        }

        // Parse the JSON response
        let inventory_data: Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse inventory JSON: {}", e))?;

        // On first page, get total_inventory_count
        if total_inventory_count == 0 {
            total_inventory_count = inventory_data
                .get("total_inventory_count")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as usize;
        }

        // Merge assets and descriptions
        if let Some(assets) = inventory_data.get("assets").and_then(|a| a.as_array()) {
            for asset in assets {
                all_assets.push(asset.clone());
            }
        }
        if let Some(descriptions) = inventory_data
            .get("descriptions")
            .and_then(|d| d.as_array())
        {
            for desc in descriptions {
                all_descriptions.push(desc.clone());
            }
        }

        // Check if we need to paginate
        let assets_len = all_assets.len();
        let more_items = inventory_data
            .get("more_items")
            .and_then(|m| m.as_bool())
            .unwrap_or(false);
        let last_assetid = inventory_data
            .get("last_assetid")
            .and_then(|id| id.as_str())
            .map(|s| s.to_string());

        if more_items && last_assetid.is_some() {
            start_assetid = last_assetid;
        } else if assets_len < total_inventory_count && last_assetid.is_some() {
            // Defensive: if more_items is missing but we know there are more
            start_assetid = last_assetid;
        } else {
            break;
        }
    }

    // Get the API key from the argument or env
    let key = api_key.unwrap_or_else(|| std::env::var("KEY").unwrap());
    let mut badge_levels: HashMap<u64, u64> = HashMap::new();
    {
        let badge_url = format!(
            "https://api.steampowered.com/IPlayerService/GetBadges/v1/?steamid={}&key={}",
            steam_id, key
        );
        let badge_resp = client.get(&badge_url).send().await;
        if let Ok(resp) = badge_resp {
            if resp.status().is_success() {
                if let Ok(badge_json) = resp.json::<Value>().await {
                    if let Some(badges) = badge_json
                        .get("response")
                        .and_then(|r| r.get("badges"))
                        .and_then(|b| b.as_array())
                    {
                        for badge in badges {
                            let appid = badge.get("appid").and_then(|a| a.as_u64()).unwrap_or(0);
                            let level = badge.get("level").and_then(|l| l.as_u64()).unwrap_or(0);
                            if appid != 0 {
                                badge_levels.insert(appid, level);
                            }
                        }
                    }
                }
            }
        }
    }

    // Create a map of classid+instanceid to assets (including amount) from assets array
    let mut asset_map: HashMap<String, Vec<(String, u64)>> = HashMap::new();
    for asset in &all_assets {
        if let (Some(classid), Some(instanceid), Some(assetid), amount) = (
            asset.get("classid").and_then(|id| id.as_str()),
            asset.get("instanceid").and_then(|id| id.as_str()),
            asset.get("assetid").and_then(|id| id.as_str()),
            asset
                .get("amount")
                .and_then(|a| a.as_str().and_then(|s| s.parse::<u64>().ok()))
                .unwrap_or(1),
        ) {
            let key = format!("{}_{}", classid, instanceid);
            asset_map
                .entry(key)
                .or_insert_with(Vec::new)
                .push((assetid.to_string(), amount));
        }
    }

    for item in &all_descriptions {
        // Check if this is a trading card and is marketable
        let is_trading_card = item
            .get("tags")
            .and_then(|tags| tags.as_array())
            .map(|tags| {
                tags.iter().any(|tag| {
                    tag.get("category")
                        .and_then(|c| c.as_str())
                        .map(|c| c == "item_class")
                        .unwrap_or(false)
                        && tag
                            .get("internal_name")
                            .and_then(|n| n.as_str())
                            .map(|n| n == "item_class_2")
                            .unwrap_or(false)
                })
            })
            .unwrap_or(false);

        // Only get marketable items
        let is_marketable = item
            .get("marketable")
            .and_then(|m| m.as_u64())
            .map(|m| m == 1)
            .unwrap_or(false);

        if is_trading_card && is_marketable {
            let classid = item.get("classid").and_then(|id| id.as_str()).unwrap_or("");
            let instanceid = item
                .get("instanceid")
                .and_then(|id| id.as_str())
                .unwrap_or("");
            let image_url = item
                .get("icon_url")
                .and_then(|url| url.as_str())
                .unwrap_or("");

            let appid = item
                .get("market_fee_app")
                .and_then(|id| id.as_u64())
                .unwrap_or(0);

            // Try multiple name fields in order
            let full_name = item
                .get("market_name")
                .and_then(|name| name.as_str())
                .or_else(|| item.get("name").and_then(|name| name.as_str()))
                .unwrap_or("");

            // Get hash name from market_hash_name or name field
            let market_hash_name = item
                .get("market_hash_name")
                .and_then(|name| name.as_str())
                .or_else(|| item.get("name").and_then(|name| name.as_str()))
                .unwrap_or("");

            // Get the game name from type field or extract from full name
            let appname = item
                .get("type")
                .and_then(|t| t.as_str())
                .and_then(|t| {
                    if t.ends_with(" Trading Card") {
                        Some(t.trim_end_matches(" Trading Card"))
                    } else {
                        None
                    }
                })
                .unwrap_or_else(|| {
                    if let Some(idx) = full_name.find(" - ") {
                        &full_name[0..idx]
                    } else if let Some(idx) = full_name.find(" Trading Card") {
                        &full_name[0..idx]
                    } else {
                        full_name
                    }
                });

            // Get badge level for this appid
            let badge_level = badge_levels.get(&appid).cloned().unwrap_or(0);

            // Check if this card is a foil
            let is_foil = item
                .get("tags")
                .and_then(|tags| tags.as_array())
                .map(|tags| {
                    tags.iter().any(|tag| {
                        tag.get("category")
                            .and_then(|c| c.as_str())
                            .map(|c| c == "cardborder")
                            .unwrap_or(false)
                            && tag
                                .get("localized_tag_name")
                                .and_then(|n| n.as_str())
                                .map(|n| n == "Foil")
                                .unwrap_or(false)
                    })
                })
                .unwrap_or(false);

            // Get assets from asset_map using classid+instanceid as key
            let key = format!("{}_{}", classid, instanceid);
            if let Some(assets) = asset_map.get(&key) {
                for (assetid, amount) in assets {
                    // Create multiple entries for items with amount > 1
                    for _ in 0..*amount {
                        if !classid.is_empty() && !image_url.is_empty() {
                            let mut card_json = json!({
                                "id": classid,
                                "assetid": assetid,
                                "appid": appid,
                                "image": format!("https://steamcommunity-a.akamaihd.net/economy/image/{}", image_url),
                                "href": format!("https://steamcommunity.com/profiles/{}/inventory/#753_6_{}", steam_id, assetid),
                                "appname": appname,
                                "full_name": full_name,
                                "market_hash_name": market_hash_name,
                                "badge_level": badge_level
                            });
                            if is_foil {
                                card_json["foil"] = json!(true);
                            }
                            trading_cards.push(card_json);
                        }
                    }
                }
            }
        }
    }

    let card_data = json!({
        "card_data": trading_cards
    });

    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());
    create_dir_all(&app_data_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;

    // Save the response to trading_cards.json
    let file_name = "trading_cards.json";
    let trading_cards_file_path = app_data_dir.join(file_name);
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&trading_cards_file_path)
        .map_err(|e| format!("Failed to open trading cards file: {}", e))?;

    let json_string = serde_json::to_string_pretty(&card_data)
        .map_err(|e| format!("Failed to serialize trading cards: {}", e))?;
    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write trading cards to file: {}", e))?;

    Ok(card_data)
}

#[tauri::command]
pub fn get_trading_cards_cache(
    steam_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());

    // Read trading cards file
    let trading_cards = {
        let file_name = "trading_cards.json";
        let cards_file_path = app_data_dir.join(file_name);
        if cards_file_path.exists() {
            let mut file = File::open(&cards_file_path)
                .map_err(|e| format!("Failed to open trading cards file: {}", e))?;
            let mut contents = String::new();
            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read trading cards file: {}", e))?;

            serde_json::from_str(&contents)
                .map_err(|e| format!("Failed to parse trading cards JSON: {}", e))?
        } else {
            json!([])
        }
    };

    Ok(trading_cards)
}

#[tauri::command]
pub async fn update_card_data(
    steam_id: String,
    key: String,
    data: Value,
    app_handle: tauri::AppHandle,
) -> Result<Value, String> {
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());

    // Check if directory exists
    if !app_data_dir.exists() {
        return Err(format!(
            "Cache directory for user {} does not exist",
            steam_id
        ));
    }

    // Define the trading_cards.json file path
    let cards_file_path = app_data_dir.join("trading_cards.json");

    if !cards_file_path.exists() {
        return Err("Card farming data file does not exist".to_string());
    }

    // Read the crads data from file
    let mut file = File::open(&cards_file_path)
        .map_err(|e| format!("Failed to open card farming file: {}", e))?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read card farming file: {}", e))?;

    let mut cards_data: Value = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse card farming JSON: {}", e))?;

    // Find and update all cards with matching market_hash_name
    let mut updated_count = 0;
    if let Some(cards_array) = cards_data["card_data"].as_array_mut() {
        for card in cards_array.iter_mut() {
            if let Some(hash_name) = card.get("market_hash_name").and_then(|n| n.as_str()) {
                if hash_name == key {
                    // Add price_data to this card
                    if let Some(obj) = card.as_object_mut() {
                        obj.insert("price_data".to_string(), data.clone());
                        updated_count += 1;
                    }
                }
            }
        }
    }

    if updated_count == 0 {
        return Err(format!("Card with market_hash_name '{}' not found", key));
    }

    // Write the updated cards data back to the file
    let json_string = serde_json::to_string_pretty(&cards_data)
        .map_err(|e| format!("Failed to serialize card farming JSON: {}", e))?;
    let mut file = File::create(&cards_file_path)
        .map_err(|e| format!("Failed to create card farming file: {}", e))?;
    file.write_all(json_string.as_bytes())
        .map_err(|e| format!("Failed to write to card farming file: {}", e))?;

    Ok(json!({
        "success": true,
        "updated_count": updated_count,
        "card_data": cards_data["card_data"]
    }))
}

#[tauri::command]
pub fn delete_user_trading_card_file(
    steam_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let trading_card_file_name = format!("trading_cards.json");
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());
    // Delete the games list file
    let trading_cards_file_path = app_data_dir.join(trading_card_file_name);
    if trading_cards_file_path.exists() {
        remove_file(&trading_cards_file_path)
            .map_err(|e| format!("Failed to delete games list file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn list_trading_cards(
    sid: String,
    sls: String,
    sma: Option<String>,
    steam_id: String,
    cards: Vec<(String, String)>,
) -> Result<Value, String> {
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() > 10 {
                attempt.stop()
            } else {
                attempt.follow()
            }
        }))
        .build()
        .map_err(|e| e.to_string())?;

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steam_id, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    let mut results = Vec::new();
    let delay = tokio::time::Duration::from_millis(500);

    for (index, (assetid, price)) in cards.into_iter().enumerate() {
        let user_price = match price.trim().parse::<f64>() {
            Ok(p) => p,
            Err(_) => {
                results.push(json!({
                    "assetid": assetid,
                    "success": false,
                    "message": "Invalid price format"
                }));
                continue;
            }
        };

        // Adjust sell price for Steam fees
        let calculate_fees = |price: f64| -> (f64, f64) {
            let valve_fee = ((price / 11.5) * 1000.0).round() / 1000.0;
            let valve_fee = (valve_fee * 100.0).floor() / 100.0;
            let valve_fee = valve_fee.max(0.01);

            let dev_fee = ((price / 23.0) * 1000.0).round() / 1000.0;
            let dev_fee = (dev_fee * 100.0).floor() / 100.0;
            let dev_fee = dev_fee.max(0.01);

            (valve_fee, dev_fee)
        };

        let find_listing_price = |target_buyer_price: f64| -> f64 {
            if target_buyer_price <= 0.10 {
                match (target_buyer_price * 100.0).round() as u64 {
                    1 => 0.01,
                    2 => 0.01,
                    3 => 0.01,
                    4 => 0.02,
                    5 => 0.03,
                    6 => 0.04,
                    7 => 0.05,
                    8 => 0.06,
                    9 => 0.07,
                    10 => 0.08,
                    _ => target_buyer_price / 1.15,
                }
            } else {
                target_buyer_price / 1.15
            }
        };

        let listing_price = find_listing_price(user_price);
        let (valve_fee, dev_fee) = calculate_fees(user_price);
        let seller_receives = user_price - valve_fee - dev_fee;
        let adjusted_price = (listing_price * 100.0).round() as u64;

        println!(
            "Listing card with assetid: {}, buyer pays: ${:.2}, API price: ${:.2}, seller receives: ${:.2}",
            assetid,
            user_price,
            listing_price,
            seller_receives
        );

        // Create form data for card listings
        let form_data = [
            ("sessionid", sid.clone()),
            ("appid", "753".to_string()),
            ("contextid", "6".to_string()),
            ("assetid", assetid.clone()),
            ("amount", "1".to_string()),
            ("price", adjusted_price.to_string()),
        ];

        let market_url = "https://steamcommunity.com/market/sellitem/";

        // Add delay between requests (except for the first one)
        if index > 0 {
            tokio::time::sleep(delay).await;
        }

        // Send the request to list the item
        let response = match client
            .post(market_url)
            .header("Cookie", &cookie_value)
            .header("Referer", format!("https://steamcommunity.com/profiles/{}/inventory", steam_id))
            .header("Origin", "https://steamcommunity.com")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
            .form(&form_data)
            .send()
            .await {
                Ok(r) => r,
                Err(e) => {
                    results.push(json!({
                        "assetid": assetid,
                        "success": false,
                        "message": format!("Request failed: {}", e)
                    }));
                    continue;
                }
            };

        // Parse response
        let response_data: Value = match response.json().await {
            Ok(data) => data,
            Err(e) => {
                results.push(json!({
                    "assetid": assetid,
                    "success": false,
                    "message": format!("Failed to parse response: {}", e)
                }));
                continue;
            }
        };

        // Get success status and store result
        let success = response_data
            .get("success")
            .and_then(|s| s.as_bool())
            .unwrap_or(false);

        if success {
            results.push(json!({
                "assetid": assetid,
                "success": true,
                "data": response_data
            }));
        } else {
            let error = response_data
                .get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("Unknown error");

            results.push(json!({
                "assetid": assetid,
                "success": false,
                "message": error
            }));
        }
    }

    Ok(json!({
        "results": results,
        "total": results.len(),
        "successful": results.iter().filter(|r| r["success"].as_bool().unwrap_or(false)).count()
    }))
}

// Get the current market price for a single trading card
#[tauri::command]
pub async fn get_card_price(
    market_hash_name: String,
    currency: Option<String>,
) -> Result<Value, String> {
    use regex::Regex;

    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() > 10 {
                attempt.stop()
            } else {
                attempt.follow()
            }
        }))
        .build()
        .map_err(|e| e.to_string())?;

    // Fetch the listing page HTML
    let url = format!(
        "https://steamcommunity.com/market/listings/753/{}",
        urlencoding::encode(&market_hash_name)
    );
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await;

    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return Ok(json!({
                "success": false,
                "error": format!("Failed to fetch listing page: {}", e)
            }));
        }
    };

    if !resp.status().is_success() {
        return Ok(json!({
            "success": false,
            "error": format!("Failed to fetch listing page: HTTP {}", resp.status())
        }));
    }
    let html = match resp.text().await {
        Ok(t) => t,
        Err(e) => {
            return Ok(json!({
                "success": false,
                "error": format!("Failed to get HTML: {}", e)
            }));
        }
    };

    // Extract item_nameid from HTML
    let re = Regex::new(r#"Market_LoadOrderSpread\(\s*(\d+)\s*\)"#);
    let re = match re {
        Ok(r) => r,
        Err(e) => {
            return Ok(json!({
                "success": false,
                "error": format!("Regex error: {}", e)
            }));
        }
    };
    let item_nameid = re
        .captures(&html)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().to_string());

    let item_nameid = match item_nameid {
        Some(id) => id,
        None => {
            return Ok(json!({
                "success": false,
                "error": "Failed to extract item_nameid"
            }));
        }
    };

    // Fetch the histogram XHR
    let histogram_url = format!(
        "https://steamcommunity.com/market/itemordershistogram?currency={}&item_nameid={}&language=english",
        currency.as_deref().unwrap_or(""),
        item_nameid
    );
    let hist_resp = client
        .get(&histogram_url)
        .header("User-Agent", "Mozilla/5.0")
        .header("Referer", &url)
        .send()
        .await;

    let hist_resp = match hist_resp {
        Ok(r) => r,
        Err(e) => {
            return Ok(json!({
                "success": false,
                "error": format!("Failed to fetch histogram: {}", e)
            }));
        }
    };

    if !hist_resp.status().is_success() {
        return Ok(json!({
            "success": false,
            "error": format!("Failed to fetch histogram: HTTP {}", hist_resp.status())
        }));
    }
    let json: Value = match hist_resp.json().await {
        Ok(j) => j,
        Err(e) => {
            return Ok(json!({
                "success": false,
                "error": format!("Failed to parse histogram JSON: {}", e)
            }));
        }
    };

    Ok({
        let mut result = json.clone();
        if let Some(obj) = result.as_object_mut() {
            obj.insert("success".to_string(), json!(true));
        }
        result
    })
}

#[tauri::command]
pub async fn remove_market_listings(
    sid: String,
    sls: String,
    sma: Option<String>,
    steam_id: String,
) -> Result<Value, String> {
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() > 10 {
                attempt.stop()
            } else {
                attempt.follow()
            }
        }))
        .build()
        .map_err(|e| e.to_string())?;

    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steam_id, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    let mut all_listings = Vec::new();
    let mut processed_listings = std::collections::HashSet::new();
    let mut start = 0;
    const COUNT: usize = 100;
    let mut total_listings = 0;
    let mut first_request = true;

    loop {
        let listings_url = format!(
            "https://steamcommunity.com/market/mylistings?start={}&count={}",
            start, COUNT
        );

        let response = client
            .get(&listings_url)
            .header("Cookie", &cookie_value)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch listings: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to fetch listings: HTTP {}",
                response.status()
            ));
        }

        let response_text = response
            .text()
            .await
            .map_err(|e| format!("Failed to get response text: {}", e))?;

        let listings_data: Value = match serde_json::from_str(&response_text) {
            Ok(json) => json,
            Err(e) => {
                return Err(format!("Failed to parse listings JSON: {}", e));
            }
        };

        if first_request {
            total_listings = listings_data
                .get("num_active_listings")
                .and_then(|n| n.as_u64())
                .unwrap_or(0) as usize;

            first_request = false;

            if total_listings == 0 {
                return Ok(json!({
                    "total_listings": 0,
                    "processed_listings": 0,
                    "results": [],
                    "successful_removals": 0
                }));
            }
        }

        if let Some(hovers) = listings_data.get("hovers").and_then(|h| h.as_str()) {
            for line in hovers.lines() {
                let line = line.trim();

                if line.contains("mylisting_") && line.contains("_name") {
                    if let Some(start_idx) = line.find("mylisting_") {
                        let start_pos = start_idx + "mylisting_".len();
                        if let Some(end_idx) = line[start_pos..].find("_name") {
                            let listing_id = &line[start_pos..(start_pos + end_idx)];

                            let parts: Vec<&str> = line.split(',').collect();
                            if parts.len() >= 5 {
                                let asset_id_part = parts[4].trim();
                                let asset_id = asset_id_part
                                    .trim_start_matches('\'')
                                    .trim_end_matches('\'')
                                    .trim();

                                if processed_listings.insert(listing_id.to_string()) {
                                    all_listings
                                        .push((listing_id.to_string(), asset_id.to_string()));
                                }
                            }
                        }
                    }
                }
            }
        }

        start += COUNT;
        if start >= total_listings {
            break;
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    let mut results = Vec::new();
    for (index, (listing_id, asset_id)) in all_listings.iter().enumerate() {
        if index > 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        }

        let remove_url = format!(
            "https://steamcommunity.com/market/removelisting/{}",
            listing_id
        );

        let response = client
            .post(&remove_url)
            .header("Cookie", &cookie_value)
            .header("Referer", "https://steamcommunity.com/market/")
            .header("Origin", "https://steamcommunity.com")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .header("X-Requested-With", "XMLHttpRequest")
            .header("Accept", "*/*")
            .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
            .form(&[("sessionid", sid.as_str())])
            .send()
            .await;

        let success = match response {
            Ok(resp) => resp.status().is_success(),
            Err(_) => false,
        };

        results.push(json!({
            "listing_id": listing_id,
            "asset_id": asset_id,
            "success": success
        }));
    }

    Ok(json!({
        "total_listings": total_listings,
        "processed_listings": all_listings.len(),
        "results": results,
        "successful_removals": results.iter().filter(|r| r["success"].as_bool().unwrap_or(false)).count()
    }))
}
