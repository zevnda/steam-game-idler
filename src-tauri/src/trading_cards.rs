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
        // Only get marketable items
        let is_marketable = item
            .get("marketable")
            .and_then(|m| m.as_u64())
            .map(|m| m == 1)
            .unwrap_or(false);

        if is_marketable {
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

            // Get the game/source name: prefer the "Game" category tag, then fall back
            // to stripping known suffixes from the type field
            let appname: String = {
                let from_game_tag = item
                    .get("tags")
                    .and_then(|tags| tags.as_array())
                    .and_then(|tags| {
                        tags.iter().find(|tag| {
                            tag.get("category")
                                .and_then(|c| c.as_str())
                                .map(|c| c.eq_ignore_ascii_case("Game"))
                                .unwrap_or(false)
                        })
                    })
                    .and_then(|tag| tag.get("localized_tag_name").and_then(|n| n.as_str()))
                    .map(|s| s.to_string());

                from_game_tag.unwrap_or_else(|| {
                    item.get("type")
                        .and_then(|t| t.as_str())
                        .and_then(|t| {
                            if t.ends_with(" Trading Card") {
                                Some(t.trim_end_matches(" Trading Card").to_string())
                            } else {
                                None
                            }
                        })
                        .unwrap_or_else(|| {
                            if let Some(idx) = full_name.find(" - ") {
                                full_name[0..idx].to_string()
                            } else if let Some(idx) = full_name.find(" Trading Card") {
                                full_name[0..idx].to_string()
                            } else {
                                full_name.to_string()
                            }
                        })
                })
            };

            // Get item type from item_class tag (e.g. "item_class_2" = trading card)
            let item_type = item
                .get("tags")
                .and_then(|tags| tags.as_array())
                .and_then(|tags| {
                    tags.iter().find(|tag| {
                        tag.get("category")
                            .and_then(|c| c.as_str())
                            .map(|c| c == "item_class")
                            .unwrap_or(false)
                    })
                })
                .and_then(|tag| tag.get("internal_name").and_then(|n| n.as_str()))
                .unwrap_or("unknown")
                .to_string();

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
                                "badge_level": badge_level,
                                "item_type": item_type
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

    // Save the response to inventory.json
    let file_name = "inventory.json";
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
        let file_name = "inventory.json";
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

    // Define the inventory.json file path
    let cards_file_path = app_data_dir.join("inventory.json");

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
    let trading_card_file_name = "inventory.json".to_string();
    let app_data_dir = get_cache_dir(&app_handle)?.join(steam_id.clone());
    // Delete the games list file
    let trading_cards_file_path = app_data_dir.join(trading_card_file_name);
    if trading_cards_file_path.exists() {
        remove_file(&trading_cards_file_path)
            .map_err(|e| format!("Failed to delete games list file: {}", e))?;
    }

    Ok(())
}

/// Returns true for Steam currency codes that have no sub-units (0 decimal places).
/// For these currencies row[0] from the histogram is already in the smallest unit
/// (e.g. ¥3 = 3, ₩100 = 100) so no ×100 conversion is needed.
fn is_zero_decimal_currency(code: u32) -> bool {
    matches!(
        code,
        8   // JPY – Japanese Yen
        | 10  // IDR – Indonesian Rupiah
        | 15  // VND – Vietnamese Dong
        | 16  // KRW – South Korean Won
        | 25  // CLP – Chilean Peso
        | 45 // HUF – Hungarian Forint
    )
}

// Given a *buyer* target price in the currency's **smallest unit** (cents for USD/EUR,
// whole units for JPY/KRW/etc.), return the **seller-receives** amount in the same unit
// such that `buyer_pays ≤ buyer_target`.
//
// Steam fees charged on top of the seller amount:
//   • Valve fee  : 5 % of seller amount, minimum 1 unit
//   • Publisher fee: 10 % of seller amount, minimum 1 unit
//
// Because the fees are floored, the buyer_pays for a given seller amount equals:
//   `seller + floor(seller × 0.05).max(1) + floor(seller × 0.10).max(1)`
//
// We start from an estimate of `floor(buyer_target / 1.15)` (exact when fees are 15 % of
// seller) and walk downward until the resulting buyer price no longer exceeds the target.
// This guarantees that existing buy-orders at `buyer_target` will match the listing.
fn find_seller_price(buyer_target: u64) -> u64 {
    if buyer_target == 0 {
        return 1;
    }
    let mut seller = ((buyer_target as f64 / 1.15).ceil() as u64 + 2).max(1);
    loop {
        let valve_fee = (seller * 5 / 100).max(1);
        let dev_fee = (seller * 10 / 100).max(1);
        if seller + valve_fee + dev_fee <= buyer_target {
            return seller;
        }
        if seller <= 1 {
            // Minimum possible listing — buyer will pay 1+1+1 = 3 units minimum
            return 1;
        }
        seller -= 1;
    }
}

#[tauri::command]
pub async fn list_trading_cards(
    sid: String,
    sls: String,
    sma: Option<String>,
    steam_id: String,
    cards: Vec<(String, String)>,
    currency: Option<String>,
    delay: Option<f64>,
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

        // Determine currency unit multiplier.
        // row[0] from Steam's histogram is expressed as a decimal in the major currency unit
        // (e.g. $0.03 for USD, €0.03 for EUR, ¥3 for JPY).
        // Steam's sellitem/ API expects the price in the currency's *smallest* unit as an integer
        // (cents for USD/EUR, whole yen for JPY, whole won for KRW, etc.).
        // For 2-decimal currencies multiply by 100; for 0-decimal currencies multiply by 1.
        let currency_code: u32 = currency.as_deref().unwrap_or("1").parse().unwrap_or(1);
        let multiplier = if is_zero_decimal_currency(currency_code) {
            1.0_f64
        } else {
            100.0_f64
        };

        // Convert buyer's target price to the smallest currency unit, then derive the
        // correct seller-receives amount that accounts for Steam's fee floors.
        let buyer_target_units = (user_price * multiplier).round() as u64;
        let adjusted_price = find_seller_price(buyer_target_units);

        println!(
            "Listing assetid={} | currency={} | buyer_target={} units | seller_receives={} units",
            assetid, currency_code, buyer_target_units, adjusted_price
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
            let delay_ms = (delay.unwrap_or(3.0) * 1000.0) as u64;
            tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
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
    // Fetch histogram with retry/backoff for HTTP 429 (rate limit)
    let json: Value = {
        let max_retries: u32 = 3;
        let mut retry_count: u32 = 0;
        loop {
            let hist_resp = client
                .get(&histogram_url)
                .header("User-Agent", "Mozilla/5.0")
                .header("Referer", &url)
                .send()
                .await;

            match hist_resp {
                Err(e) => {
                    return Ok(json!({
                        "success": false,
                        "error": format!("Failed to fetch histogram: {}", e)
                    }));
                }
                Ok(r) if r.status().as_u16() == 429 => {
                    if retry_count >= max_retries {
                        return Ok(json!({
                            "success": false,
                            "error": "HTTP 429: Rate limited (max retries exceeded)"
                        }));
                    }
                    // Exponential backoff: 5s, 10s, 20s
                    let delay_ms = 5_000u64 * (1u64 << retry_count);
                    retry_count += 1;
                    tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
                }
                Ok(r) if !r.status().is_success() => {
                    return Ok(json!({
                        "success": false,
                        "error": format!("HTTP {}", r.status())
                    }));
                }
                Ok(r) => match r.json::<Value>().await {
                    Ok(j) => break j,
                    Err(e) => {
                        return Ok(json!({
                            "success": false,
                            "error": format!("Failed to parse histogram JSON: {}", e)
                        }));
                    }
                },
            }
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
