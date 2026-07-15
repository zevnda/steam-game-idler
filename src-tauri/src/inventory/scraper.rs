//! Marketable inventory fetch - ported from `main`'s `get_trading_cards`: pagination through Steam
//! Community's `/inventory/{steamId}/753/6` endpoint (appid 753 = Steam, contextid 6 = community
//! items), enriched with each item's game's badge level via the Steam Web API's `GetBadges`,
//! filtered to marketable items and typed onto [`super::InventoryItem`] instead of `main`'s ad hoc
//! `serde_json::Value` construction (see `mod.rs`'s doc comment on the camelCase deviation). Covers
//! every marketable item type sharing the `item_class_N` tag family, not trading cards alone - see
//! `mod.rs`'s doc comment.

use std::collections::HashMap;

use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;

use crate::error::{AppError, AppResult};
use crate::steam_community::{cookie_header, steam_client, SteamCookies};
use crate::steam_web_api::resolve_api_key;

use super::InventoryItem;

#[derive(Debug, Deserialize, Default)]
struct GetBadgesResponse {
    #[serde(default)]
    response: GetBadgesInner,
}

#[derive(Debug, Deserialize, Default)]
struct GetBadgesInner {
    #[serde(default)]
    badges: Vec<BadgeEntry>,
}

#[derive(Debug, Deserialize)]
struct BadgeEntry {
    #[serde(default)]
    appid: u32,
    #[serde(default)]
    level: u32,
}

/// Badge levels are cosmetic enrichment only, not load-bearing for the fetch itself - mirrors
/// `main`'s own best-effort treatment (a failed/missing badge lookup just leaves every item's
/// `badge_level` at 0) rather than failing the whole inventory fetch over a secondary API call.
async fn fetch_badge_levels(
    client: &Client,
    steam_id: &str,
    api_key: Option<String>,
) -> HashMap<u32, u32> {
    let Ok(key) = resolve_api_key(api_key) else {
        tracing::warn!(steam_id, "inventory: badge level lookup skipped - no API key available");
        return HashMap::new();
    };
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetBadges/v1/?steamid={steam_id}&key={key}"
    );
    let Ok(response) = client.get(&url).send().await else {
        tracing::warn!(steam_id, "inventory: badge level request failed");
        return HashMap::new();
    };
    if !response.status().is_success() {
        tracing::warn!(
            steam_id,
            status = %response.status(),
            "inventory: badge level request returned non-success status"
        );
        return HashMap::new();
    }
    let Ok(body) = response.json::<GetBadgesResponse>().await else {
        tracing::warn!(steam_id, "inventory: badge level response parse failed");
        return HashMap::new();
    };
    body.response
        .badges
        .into_iter()
        .filter(|b| b.appid != 0)
        .map(|b| (b.appid, b.level))
        .collect()
}

/// Fetches every page of `/inventory/{steamId}/753/6`, merging `assets` (one entry per owned copy,
/// including quantity for stackable items) and `descriptions` (one entry per distinct
/// classid+instanceid "kind") - paginated via `start_assetid`/`more_items`/`last_assetid` exactly
/// like `main`'s own loop, including its defensive fallback (keep paginating if the running asset
/// count is still short of `total_inventory_count` even when `more_items` is missing/false).
async fn fetch_inventory_pages(
    client: &Client,
    steam_id: &str,
    cookie_value: &str,
) -> AppResult<(Vec<Value>, Vec<Value>)> {
    let mut all_assets = Vec::new();
    let mut all_descriptions = Vec::new();
    let mut start_assetid: Option<String> = None;
    let mut total_inventory_count = 0usize;

    loop {
        let mut inventory_url =
            format!("https://steamcommunity.com/inventory/{steam_id}/753/6?l=english&count=2500");
        if let Some(start) = &start_assetid {
            inventory_url.push_str(&format!("&start_assetid={start}"));
        }

        let response = client
            .get(&inventory_url)
            .header("Cookie", cookie_value)
            .send()
            .await
            .map_err(|e| AppError::InventoryFetchFailed(e.to_string()))?;

        if !response.status().is_success() {
            return Err(AppError::InventoryFetchFailed(format!(
                "HTTP {}",
                response.status()
            )));
        }

        let page: Value = response
            .json()
            .await
            .map_err(|e| AppError::InventoryFetchFailed(e.to_string()))?;

        if total_inventory_count == 0 {
            total_inventory_count = page
                .get("total_inventory_count")
                .and_then(Value::as_u64)
                .unwrap_or(0) as usize;
        }

        if let Some(assets) = page.get("assets").and_then(Value::as_array) {
            all_assets.extend(assets.iter().cloned());
        }
        if let Some(descriptions) = page.get("descriptions").and_then(Value::as_array) {
            all_descriptions.extend(descriptions.iter().cloned());
        }

        let more_items = page
            .get("more_items")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let last_assetid = page
            .get("last_assetid")
            .and_then(Value::as_str)
            .map(str::to_string);

        if (more_items || all_assets.len() < total_inventory_count) && last_assetid.is_some() {
            start_assetid = last_assetid;
        } else {
            break;
        }
    }

    Ok((all_assets, all_descriptions))
}

/// Maps `classid_instanceid` to every owned `(assetid, amount)` copy - `main`'s own key shape.
fn asset_quantities(assets: &[Value]) -> HashMap<String, Vec<(String, u64)>> {
    let mut asset_map: HashMap<String, Vec<(String, u64)>> = HashMap::new();
    for asset in assets {
        let (Some(classid), Some(instanceid), Some(assetid)) = (
            asset.get("classid").and_then(Value::as_str),
            asset.get("instanceid").and_then(Value::as_str),
            asset.get("assetid").and_then(Value::as_str),
        ) else {
            continue;
        };
        let amount = asset
            .get("amount")
            .and_then(Value::as_str)
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(1);
        asset_map
            .entry(format!("{classid}_{instanceid}"))
            .or_default()
            .push((assetid.to_string(), amount));
    }
    asset_map
}

fn tag_localized_name<'a>(item: &'a Value, category: &str) -> Option<&'a str> {
    item.get("tags")
        .and_then(Value::as_array)?
        .iter()
        .find(|tag| {
            tag.get("category")
                .and_then(Value::as_str)
                .map(|c| c.eq_ignore_ascii_case(category))
                .unwrap_or(false)
        })
        .and_then(|tag| tag.get("localized_tag_name").and_then(Value::as_str))
}

/// Game/source name for one item - prefers the "Game" category tag, then falls back to stripping
/// known suffixes from the `type`/`full_name` fields, mirroring `main`'s exact precedence.
fn resolve_app_name(item: &Value, full_name: &str) -> String {
    if let Some(name) = tag_localized_name(item, "Game") {
        return name.to_string();
    }
    if let Some(stripped) = item
        .get("type")
        .and_then(Value::as_str)
        .and_then(|t| t.strip_suffix(" Trading Card"))
    {
        return stripped.to_string();
    }
    if let Some(idx) = full_name.find(" - ") {
        return full_name[..idx].to_string();
    }
    if let Some(idx) = full_name.find(" Trading Card") {
        return full_name[..idx].to_string();
    }
    full_name.to_string()
}

/// Steam's `item_class_N` tag (`item_class_2` = trading card, etc.) - `"unknown"` if absent,
/// matching `main`'s fallback.
fn resolve_item_type(item: &Value) -> String {
    item.get("tags")
        .and_then(Value::as_array)
        .and_then(|tags| {
            tags.iter()
                .find(|tag| tag.get("category").and_then(Value::as_str) == Some("item_class"))
        })
        .and_then(|tag| tag.get("internal_name").and_then(Value::as_str))
        .unwrap_or("unknown")
        .to_string()
}

fn is_foil(item: &Value) -> bool {
    item.get("tags")
        .and_then(Value::as_array)
        .map(|tags| {
            tags.iter().any(|tag| {
                tag.get("category").and_then(Value::as_str) == Some("cardborder")
                    && tag.get("localized_tag_name").and_then(Value::as_str) == Some("Foil")
            })
        })
        .unwrap_or(false)
}

/// Fetches `steam_id`'s full marketable inventory and enriches it with badge levels - mirrors
/// `main`'s `get_trading_cards` exactly (same endpoint, same pagination, same tag precedence for
/// name/type/foil detection), typed onto [`InventoryItem`] instead of `main`'s ad hoc `Value`
/// construction.
pub async fn fetch_inventory_items(
    steam_id: &str,
    cookies: &SteamCookies,
    api_key: Option<String>,
) -> AppResult<Vec<InventoryItem>> {
    let client = steam_client().map_err(|e| AppError::InventoryFetchFailed(e.to_string()))?;
    let cookie_value = cookie_header(steam_id, cookies);

    let (all_assets, all_descriptions) =
        fetch_inventory_pages(&client, steam_id, &cookie_value).await?;
    let badge_levels = fetch_badge_levels(&client, steam_id, api_key).await;
    let asset_map = asset_quantities(&all_assets);

    let mut items = Vec::new();
    for item in &all_descriptions {
        let is_marketable = item
            .get("marketable")
            .and_then(Value::as_u64)
            .map(|m| m == 1)
            .unwrap_or(false);
        if !is_marketable {
            continue;
        }

        let classid = item.get("classid").and_then(Value::as_str).unwrap_or("");
        let instanceid = item.get("instanceid").and_then(Value::as_str).unwrap_or("");
        let image_url = item.get("icon_url").and_then(Value::as_str).unwrap_or("");
        if classid.is_empty() || image_url.is_empty() {
            continue;
        }

        let Some(assets) = asset_map.get(&format!("{classid}_{instanceid}")) else {
            continue;
        };

        let app_id = item
            .get("market_fee_app")
            .and_then(Value::as_u64)
            .unwrap_or(0) as u32;
        let full_name = item
            .get("market_name")
            .and_then(Value::as_str)
            .or_else(|| item.get("name").and_then(Value::as_str))
            .unwrap_or("")
            .to_string();
        let market_hash_name = item
            .get("market_hash_name")
            .and_then(Value::as_str)
            .or_else(|| item.get("name").and_then(Value::as_str))
            .unwrap_or("")
            .to_string();
        let app_name = resolve_app_name(item, &full_name);
        let item_type = resolve_item_type(item);
        let badge_level = badge_levels.get(&app_id).copied().unwrap_or(0);
        let foil = is_foil(item);

        for (assetid, amount) in assets {
            for _ in 0..*amount {
                items.push(InventoryItem {
                    id: classid.to_string(),
                    assetid: assetid.clone(),
                    app_id,
                    image: format!(
                        "https://steamcommunity-a.akamaihd.net/economy/image/{image_url}"
                    ),
                    href: format!(
                        "https://steamcommunity.com/profiles/{steam_id}/inventory/#753_6_{assetid}"
                    ),
                    app_name: app_name.clone(),
                    full_name: full_name.clone(),
                    market_hash_name: market_hash_name.clone(),
                    badge_level,
                    item_type: item_type.clone(),
                    foil,
                    price_data: None,
                });
            }
        }
    }

    Ok(items)
}
