//! Market actions - price lookup, listing, and removing listings. Ported from `main`'s
//! `get_card_price`/`list_trading_cards`/`remove_market_listings`, same URLs/fee math/parsing,
//! typed onto this module's result structs instead of `main`'s ad hoc `serde_json::Value`. Applies
//! to any marketable item, not trading cards specifically - see `mod.rs`'s doc comment. Unlike
//! [`super::scraper`] (inventory fetch), [`get_item_price`] needs no Steam Community session at all
//! - Steam's market orderbook endpoint is anonymous - so it's the one function here that takes
//! neither `account` nor `manual_cookies`.

use std::collections::HashSet;
use std::time::Duration;

use reqwest::Client;
use serde_json::Value;

use crate::error::{AppError, AppResult};
use crate::steam_community::{cookie_header, steam_client, SteamCookies};

use super::{
    ListItemsResult, ListingResult, OrderGraphEntry, PriceData, RemoveListingsResult,
    RemovedListing,
};

const MAX_PRICE_RETRIES: u32 = 3;

/// Returns true for Steam currency codes that have no sub-units (0 decimal places). For these
/// currencies row[0] from the histogram is already in the smallest unit (e.g. JPY 3 = 3, KRW 100 =
/// 100) so no x100 conversion is needed. IDR is intentionally excluded: despite being used
/// colloquially without decimals, Steam stores it in hundredths like USD/EUR.
fn is_zero_decimal_currency(code: u32) -> bool {
    matches!(
        code,
        8   // JPY - Japanese Yen
        | 15  // VND - Vietnamese Dong
        | 16  // KRW - South Korean Won
        | 25 // CLP - Chilean Peso
    )
}

/// Formats a price with the correct number of decimal places for its currency.
fn format_price(price: f64, currency_code: u32) -> String {
    if is_zero_decimal_currency(currency_code) {
        format!("{price:.0}")
    } else {
        format!("{price:.2}")
    }
}

/// Given a *buyer* target price in the currency's **smallest unit** (cents for USD/EUR, whole
/// units for JPY/KRW/etc.), returns the **seller-receives** amount in the same unit such that
/// `buyer_pays <= buyer_target`.
///
/// Steam fees charged on top of the seller amount:
///   - Valve fee: 5% of seller amount, minimum 1 unit
///   - Publisher fee: 10% of seller amount, minimum 1 unit
///
/// Because the fees are floored, the buyer_pays for a given seller amount equals:
///   `seller + floor(seller * 0.05).max(1) + floor(seller * 0.10).max(1)`
///
/// Starts from an estimate of `floor(buyer_target / 1.15)` (exact when fees are 15% of seller) and
/// walks downward until the resulting buyer price no longer exceeds the target - guarantees that
/// existing buy-orders at `buyer_target` will match the listing.
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
            // Minimum possible listing - buyer will pay 1+1+1 = 3 units minimum.
            return 1;
        }
        seller -= 1;
    }
}

fn currency_multiplier(currency_code: u32) -> f64 {
    if is_zero_decimal_currency(currency_code) {
        1.0
    } else {
        100.0
    }
}

fn parse_order_graph(entries: &[Value], currency_code: u32) -> Vec<OrderGraphEntry> {
    let multiplier = currency_multiplier(currency_code);
    entries
        .chunks(2)
        .filter(|c| c.len() == 2)
        .filter_map(|c| {
            let price = c[0].as_f64()? / multiplier;
            let qty = c[1].as_u64().unwrap_or(0);
            let label = format!("{} orders at {}", qty, format_price(price, currency_code));
            Some((price, qty, label))
        })
        .collect()
}

/// The current market price/order-book snapshot for one item, by its `market_hash_name` - `main`'s
/// `get_card_price`. No session/cookies needed: Steam's market orderbook endpoint is anonymous, and
/// works for any marketable item (not trading cards specifically).
pub async fn get_item_price(
    market_hash_name: &str,
    currency: Option<String>,
) -> AppResult<PriceData> {
    let client = steam_client().map_err(|e| AppError::MarketPriceFetchFailed(e.to_string()))?;

    let qp = serde_json::to_string(&serde_json::json!([753, market_hash_name]))
        .map_err(|e| AppError::MarketPriceFetchFailed(e.to_string()))?;
    let orderbook_url = format!(
        "https://steamcommunity.com/market/orderbook?q=Load&qp={}&currency={}",
        urlencoding::encode(&qp),
        currency.as_deref().unwrap_or("1")
    );
    let referer = format!(
        "https://steamcommunity.com/market/listings/753/{}",
        urlencoding::encode(market_hash_name)
    );

    let mut retry_count: u32 = 0;
    let json: Value = loop {
        let response = client
            .get(&orderbook_url)
            .header("Referer", &referer)
            .send()
            .await
            .map_err(|e| AppError::MarketPriceFetchFailed(e.to_string()))?;

        if response.status().as_u16() == 429 {
            if retry_count >= MAX_PRICE_RETRIES {
                tracing::warn!(market_hash_name, "market: price fetch rate limited after retries");
                return Err(AppError::MarketPriceRateLimited);
            }
            let delay_ms = 5_000u64 * (1u64 << retry_count);
            retry_count += 1;
            tokio::time::sleep(Duration::from_millis(delay_ms)).await;
            continue;
        }
        if !response.status().is_success() {
            tracing::warn!(
                market_hash_name,
                status = %response.status(),
                "market: price fetch failed"
            );
            return Err(AppError::MarketPriceFetchFailed(format!(
                "HTTP {}",
                response.status()
            )));
        }
        break response
            .json::<Value>()
            .await
            .map_err(|e| AppError::MarketPriceFetchFailed(e.to_string()))?;
    };

    let data = &json["data"];
    let e_currency = data["eCurrency"].as_u64().unwrap_or(1) as u32;

    let sell_order_graph = data["rgCompactSellOrders"]
        .as_array()
        .map(|arr| parse_order_graph(arr, e_currency))
        .unwrap_or_default();
    let buy_order_graph = data["rgCompactBuyOrders"]
        .as_array()
        .map(|arr| parse_order_graph(arr, e_currency))
        .unwrap_or_default();

    let multiplier = currency_multiplier(e_currency);
    let highest_buy_order = data["amtMaxBuyOrder"].as_f64().map(|p| p / multiplier);
    let lowest_sell_order = data["amtMinSellOrder"].as_f64().map(|p| p / multiplier);
    let c_buy = data["cBuyOrders"].as_u64().unwrap_or(0);
    let c_sell = data["cSellOrders"].as_u64().unwrap_or(0);

    tracing::info!(market_hash_name, "market: fetched item price");

    Ok(PriceData {
        sell_order_graph,
        buy_order_graph,
        highest_buy_order,
        lowest_sell_order,
        buy_order_summary: format!("{c_buy} buy orders"),
        sell_order_summary: format!("{c_sell} sell orders"),
    })
}

/// Lists `items` (`(assetid, price-as-typed-by-the-user)` pairs, already adjusted for any
/// price-adjustment/sell-limit filtering the frontend applies before calling this - the backend
/// only knows about the final price to list at) on the Steam Community market. A per-item failure
/// (bad price format, a rejected listing) is collected into that item's own [`ListingResult`]
/// rather than aborting the whole call, mirroring `main`'s same per-item aggregation.
pub async fn list_items(
    steam_id: &str,
    cookies: &SteamCookies,
    items: Vec<(String, String)>,
    currency: Option<String>,
    delay: Option<f64>,
) -> AppResult<ListItemsResult> {
    let client = steam_client().map_err(|e| AppError::MarketPriceFetchFailed(e.to_string()))?;
    let cookie_value = cookie_header(steam_id, cookies);
    let currency_code: u32 = currency.as_deref().unwrap_or("1").parse().unwrap_or(1);
    let multiplier = currency_multiplier(currency_code);

    let mut results = Vec::with_capacity(items.len());
    for (index, (assetid, price)) in items.into_iter().enumerate() {
        let user_price: f64 = match price.trim().parse() {
            Ok(p) => p,
            Err(_) => {
                tracing::warn!(assetid = %assetid, "market: listing failed - invalid price format");
                results.push(ListingResult {
                    assetid,
                    success: false,
                    message: Some("Invalid price format".to_string()),
                    needs_email_confirmation: false,
                    needs_mobile_confirmation: false,
                });
                continue;
            }
        };

        let buyer_target_units = (user_price * multiplier).round() as u64;
        let adjusted_price = find_seller_price(buyer_target_units);

        if index > 0 {
            // 10s (not the price-lookup endpoint's own retry backoff) matches this account's
            // configured sellDelay default - see settings.rs's `Default for InventorySettings`.
            // Only used if the caller genuinely passed no delay at all (a settings-load race);
            // every real call site always threads the account's actual `sellDelay` through.
            let delay_ms = (delay.unwrap_or(10.0) * 1000.0) as u64;
            tokio::time::sleep(Duration::from_millis(delay_ms)).await;
        }

        let form_data = [
            ("sessionid", cookies.sid.clone()),
            ("appid", "753".to_string()),
            ("contextid", "6".to_string()),
            ("assetid", assetid.clone()),
            ("amount", "1".to_string()),
            ("price", adjusted_price.to_string()),
        ];

        let response = match client
            .post("https://steamcommunity.com/market/sellitem/")
            .header("Cookie", &cookie_value)
            .header(
                "Referer",
                format!("https://steamcommunity.com/profiles/{steam_id}/inventory"),
            )
            .header("Origin", "https://steamcommunity.com")
            .form(&form_data)
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                tracing::warn!(assetid = %assetid, error = %e, "market: listing request failed");
                results.push(ListingResult {
                    assetid,
                    success: false,
                    message: Some(format!("Request failed: {e}")),
                    needs_email_confirmation: false,
                    needs_mobile_confirmation: false,
                });
                continue;
            }
        };

        // Unlike `get_item_price`'s orderbook endpoint (genuinely IP-throttled, confirmed via
        // `main`'s real retry logic there), `main` never special-cased a raw HTTP 429 on this
        // listing endpoint - it always parsed the JSON body and detected rate-limiting from the
        // `message` text below instead (same as this function's own check a few lines down). A
        // raw 429 here can have other causes (session/CSRF issues, a market-privilege
        // restriction), so don't assume "genuine Steam rate limit" and discard the body before
        // even reading it - let it flow into the same parse-and-inspect path as any other status.

        let status = response.status();
        let body_text = match response.text().await {
            Ok(t) => t,
            Err(e) => {
                tracing::warn!(assetid = %assetid, error = %e, "market: listing response read failed");
                results.push(ListingResult {
                    assetid,
                    success: false,
                    message: Some(format!("Failed to read response: {e}")),
                    needs_email_confirmation: false,
                    needs_mobile_confirmation: false,
                });
                continue;
            }
        };
        // `.json()` consumes the body without a way to inspect it on failure - buffer as text
        // first so a non-JSON response (an HTML login/checkpoint page, a WAF block page) is
        // actually visible in the log and the per-item message instead of a bare serde error.
        let response_data: Value = match serde_json::from_str(&body_text) {
            Ok(data) => data,
            Err(e) => {
                let snippet: String = body_text.chars().take(300).collect();
                tracing::warn!(
                    assetid = %assetid,
                    %status,
                    error = %e,
                    body = %snippet,
                    "market: listing response parse failed"
                );
                results.push(ListingResult {
                    assetid,
                    success: false,
                    message: Some(format!("Unexpected response (HTTP {status}): {snippet}")),
                    needs_email_confirmation: false,
                    needs_mobile_confirmation: false,
                });
                continue;
            }
        };

        let success = response_data
            .get("success")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let message = (!success).then(|| {
            response_data
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("Unknown error")
                .to_string()
        });
        if let Some(msg) = &message {
            tracing::warn!(assetid = %assetid, message = %msg, "market: listing rejected by Steam");
        }
        // Same message-text rate-limit detection `main`'s frontend loop used (Steam has no
        // dedicated error code for this case, just a human-readable message) - stop the batch here
        // too rather than only on a hard HTTP 429.
        let rate_limited = message
            .as_deref()
            .is_some_and(|m| m.to_lowercase().contains("rate limit"));
        results.push(ListingResult {
            assetid,
            success,
            message,
            needs_email_confirmation: response_data
                .get("needs_email_confirmation")
                .and_then(Value::as_bool)
                .unwrap_or(false),
            needs_mobile_confirmation: response_data
                .get("needs_mobile_confirmation")
                .and_then(Value::as_bool)
                .unwrap_or(false),
        });
        if rate_limited {
            tracing::warn!("market: listing rejected as rate limited - stopping batch");
            break;
        }
    }

    let successful = results.iter().filter(|r| r.success).count();
    tracing::info!(total = results.len(), successful, "market: listed items");
    Ok(ListItemsResult {
        total: results.len(),
        successful,
        results,
    })
}

/// Extracts `(listing_id, asset_id)` pairs from Steam's `mylistings` response's `hovers` field - a
/// blob of JS-ish text embedding one `CreateItemHoverFromContainer('mylisting_{id}_name', ...,
/// assetid, ...)`-shaped call per listing. Steam doesn't expose these as structured JSON, so this
/// is a string scan, not a real parser - ported verbatim from `main`'s same approach (not something
/// a cleaner implementation could meaningfully replace without inventing a bespoke parser for a
/// one-off blob format only this endpoint uses).
fn parse_listing_ids(hovers: &str) -> Vec<(String, String)> {
    let mut seen = HashSet::new();
    let mut listings = Vec::new();

    for line in hovers.lines() {
        let line = line.trim();
        if !(line.contains("mylisting_") && line.contains("_name")) {
            continue;
        }
        let Some(start_idx) = line.find("mylisting_") else {
            continue;
        };
        let start_pos = start_idx + "mylisting_".len();
        let Some(end_idx) = line[start_pos..].find("_name") else {
            continue;
        };
        let listing_id = &line[start_pos..(start_pos + end_idx)];

        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() < 5 {
            continue;
        }
        let asset_id = parts[4].trim().trim_matches('\'').trim();

        if seen.insert(listing_id.to_string()) {
            listings.push((listing_id.to_string(), asset_id.to_string()));
        }
    }

    listings
}

async fn fetch_all_listing_ids(
    client: &Client,
    cookie_value: &str,
) -> AppResult<Vec<(String, String)>> {
    const PAGE_SIZE: usize = 100;

    let mut all_listings = Vec::new();
    let mut seen = HashSet::new();
    let mut start = 0usize;
    let mut total_listings = 0usize;
    let mut first_request = true;

    loop {
        let listings_url =
            format!("https://steamcommunity.com/market/mylistings?start={start}&count={PAGE_SIZE}");

        let response = client
            .get(&listings_url)
            .header("Cookie", cookie_value)
            .send()
            .await
            .map_err(|e| AppError::MarketListingsFetchFailed(e.to_string()))?;

        if !response.status().is_success() {
            return Err(AppError::MarketListingsFetchFailed(format!(
                "HTTP {}",
                response.status()
            )));
        }

        let listings_data: Value = response
            .json()
            .await
            .map_err(|e| AppError::MarketListingsFetchFailed(e.to_string()))?;

        if first_request {
            total_listings = listings_data
                .get("num_active_listings")
                .and_then(Value::as_u64)
                .unwrap_or(0) as usize;
            first_request = false;
            if total_listings == 0 {
                return Ok(Vec::new());
            }
        }

        if let Some(hovers) = listings_data.get("hovers").and_then(Value::as_str) {
            for (listing_id, asset_id) in parse_listing_ids(hovers) {
                if seen.insert(listing_id.clone()) {
                    all_listings.push((listing_id, asset_id));
                }
            }
        }

        start += PAGE_SIZE;
        if start >= total_listings {
            break;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    Ok(all_listings)
}

/// Fetches every active market listing and cancels each one - `main`'s `remove_market_listings`.
/// Fetching the listing-id pages is not best-effort (a real failure aborts the whole call, same as
/// `main`); cancelling each individual listing is best-effort, collected into a per-listing
/// [`RemovedListing`] rather than aborting on the first failure.
pub async fn remove_market_listings(
    steam_id: &str,
    cookies: &SteamCookies,
) -> AppResult<RemoveListingsResult> {
    let client = steam_client().map_err(|e| AppError::MarketListingsFetchFailed(e.to_string()))?;
    let cookie_value = cookie_header(steam_id, cookies);

    let all_listings = fetch_all_listing_ids(&client, &cookie_value).await?;
    if all_listings.is_empty() {
        return Ok(RemoveListingsResult {
            total_listings: 0,
            processed_listings: 0,
            results: Vec::new(),
            successful_removals: 0,
        });
    }

    let total_listings = all_listings.len();
    let mut results = Vec::with_capacity(total_listings);
    for (index, (listing_id, asset_id)) in all_listings.into_iter().enumerate() {
        if index > 0 {
            tokio::time::sleep(Duration::from_millis(1000)).await;
        }

        let remove_url = format!("https://steamcommunity.com/market/removelisting/{listing_id}");
        let response = client
            .post(&remove_url)
            .header("Cookie", &cookie_value)
            .header("Referer", "https://steamcommunity.com/market/")
            .header("Origin", "https://steamcommunity.com")
            .header("X-Requested-With", "XMLHttpRequest")
            .header("Accept", "*/*")
            .header(
                "Content-Type",
                "application/x-www-form-urlencoded; charset=UTF-8",
            )
            .form(&[("sessionid", cookies.sid.as_str())])
            .send()
            .await;

        let mut rate_limited = false;
        let success = match response {
            Ok(r) => {
                if r.status().as_u16() == 429 {
                    rate_limited = true;
                }
                let ok = r.status().is_success();
                if !ok {
                    tracing::warn!(listing_id, status = %r.status(), "market: listing removal failed");
                }
                ok
            }
            Err(e) => {
                tracing::warn!(listing_id, error = %e, "market: listing removal request failed");
                false
            }
        };
        results.push(RemovedListing {
            listing_id,
            asset_id,
            success,
        });
        if rate_limited {
            // Same reasoning as list_items's 429 guard - stop cancelling the rest of the batch
            // rather than burning through every remaining listing into the same throttle.
            tracing::warn!("market: listing removal rate limited - stopping batch");
            break;
        }
    }

    let successful_removals = results.iter().filter(|r| r.success).count();
    tracing::info!(
        total_listings,
        successful_removals,
        "market: removed listings"
    );
    Ok(RemoveListingsResult {
        total_listings,
        processed_listings: results.len(),
        results,
        successful_removals,
    })
}
