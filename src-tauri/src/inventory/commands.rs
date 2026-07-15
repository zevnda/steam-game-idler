use tauri::{AppHandle, State};

use crate::error::{AppError, AppResult};
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::steam_agent::AgentManager;
use crate::steam_community::{session, SteamCookies};

use super::{
    cache, market, scraper, settings, InventoryItem, ListItemsResult, PriceData,
    RemoveListingsResult,
};
use settings::InventorySettings;

/// Fetches `account`'s full marketable inventory (trading cards + badge-eligible backgrounds/
/// emoticons/boosters/sale items), enriches each item with its game's badge level via the Steam Web
/// API, and caches the result keyed by the account's resolved SteamID64. `manual_cookies` behaves
/// exactly like `card_farming::commands::get_drops_remaining`'s - omit it to resolve cookies
/// automatically for the account's sign-in mode (expected to be gated behind `hasGamerAccess` once
/// a frontend exists for this feature), or supply a manually-pasted set to skip that resolution
/// entirely (the casual/free-tier path, always available regardless of tier). `api_key` is an
/// explicit Steam Web API key override; omit to use the embedded build key (see
/// `steam_web_api::resolve_api_key`).
#[tauri::command]
pub async fn get_inventory(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    manual_cookies: Option<SteamCookies>,
    api_key: Option<String>,
) -> AppResult<Vec<InventoryItem>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(
        &app_handle,
        &agent_manager,
        &account,
        &steam_id,
        manual_cookies,
    )
    .await?;
    let items = scraper::fetch_inventory_items(&steam_id, &cookies, api_key).await?;
    cache::write(&app_handle, &steam_id, &items)?;
    tracing::info!(steam_id, count = items.len(), "fetched inventory");
    Ok(items)
}

/// Reads back the last cached inventory for `steam_id` without hitting the network - an empty list
/// if nothing has been cached yet (not an error, same convention `get_owned_games_cache` already
/// uses).
#[tauri::command]
pub fn get_inventory_cache(
    app_handle: AppHandle,
    steam_id: String,
) -> AppResult<Vec<InventoryItem>> {
    cache::read(&app_handle, &steam_id)
}

#[tauri::command]
pub fn delete_inventory_cache(app_handle: AppHandle, steam_id: String) -> AppResult<()> {
    cache::delete(&app_handle, &steam_id)
}

/// The current market order-book snapshot for one item, by its `market_hash_name` - no `account`/
/// `manual_cookies` needed, since Steam's market orderbook endpoint is anonymous and works for any
/// marketable item (see `market.rs`'s doc comment). A rate-limited response (HTTP 429, retried up
/// to 3 times first) surfaces as the dedicated `market_price_rate_limited` code rather than the
/// generic fetch-failed one, so the frontend can special-case it (e.g. a distinct "try again in a
/// moment" message) the same way `main`'s frontend already does.
#[tauri::command]
pub async fn get_item_price(
    market_hash_name: String,
    currency: Option<String>,
) -> AppResult<PriceData> {
    market::get_item_price(&market_hash_name, currency).await
}

/// Lists `items` (`(assetid, price)` pairs, already adjusted/filtered by the caller - see
/// `market::list_items`'s doc comment) on the Steam Community market for `account`.
/// `manual_cookies` behaves exactly like [`get_inventory`]'s.
#[tauri::command]
pub async fn list_items(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    manual_cookies: Option<SteamCookies>,
    items: Vec<(String, String)>,
    currency: Option<String>,
    delay: Option<f64>,
) -> AppResult<ListItemsResult> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(
        &app_handle,
        &agent_manager,
        &account,
        &steam_id,
        manual_cookies,
    )
    .await?;
    market::list_items(&steam_id, &cookies, items, currency, delay).await
}

/// Annotates every cached item matching `market_hash_name` with a freshly-fetched `price_data` (an
/// item's stacked copies all share one `market_hash_name`, so more than one entry may update) and
/// persists the change - `main`'s `update_card_data`. Errors if `steam_id` has no cached inventory
/// at all, or no item in it matches `market_hash_name` (mirrors `main`'s same two failure cases,
/// typed instead of a raw string).
#[tauri::command]
pub fn update_item_price_data(
    app_handle: AppHandle,
    steam_id: String,
    market_hash_name: String,
    price_data: PriceData,
) -> AppResult<Vec<InventoryItem>> {
    let mut items = cache::read(&app_handle, &steam_id)?;
    let mut updated = 0usize;
    for item in items.iter_mut() {
        if item.market_hash_name == market_hash_name {
            item.price_data = Some(price_data.clone());
            updated += 1;
        }
    }
    if updated == 0 {
        return Err(AppError::InventoryItemNotFound(market_hash_name));
    }
    cache::write(&app_handle, &steam_id, &items)?;
    Ok(items)
}

/// Cancels every active market listing for `account` - `main`'s `remove_market_listings`.
/// `manual_cookies` behaves exactly like [`get_inventory`]'s.
#[tauri::command]
pub async fn remove_market_listings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    manual_cookies: Option<SteamCookies>,
) -> AppResult<RemoveListingsResult> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(
        &app_handle,
        &agent_manager,
        &account,
        &steam_id,
        manual_cookies,
    )
    .await?;
    market::remove_market_listings(&steam_id, &cookies).await
}

/// This account's inventory selling preferences (`main`'s `tradingCards` settings category) -
/// price preference, price adjustment, sell-price limits, delay between listings.
#[tauri::command]
pub async fn get_inventory_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<InventorySettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get(&app_handle, &steam_id).await
}

/// Whole-struct replace - see `settings::set`'s doc comment for why this isn't a dot-path merge.
#[tauri::command]
pub async fn set_inventory_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    settings: InventorySettings,
) -> AppResult<InventorySettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::settings::set(&app_handle, &steam_id, settings).await
}
