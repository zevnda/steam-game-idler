//! Steam Community marketable inventory (fetch/cache) and market actions. Covers every marketable
//! Community item type sharing the `item_class_N` tag family (trading cards, backgrounds,
//! emoticons, booster packs, sale items), not trading cards specifically - naming throughout this
//! module says "inventory"/"item"/"listing", reserving "card"/"trading card" only for things that
//! are genuinely card-specific. Separate infrastructure from `steam_agent`/`local_steam`, but
//! shares `steam_community`'s cookie/session-acquisition mechanism with `card_farming` - both need
//! the same Steam Community auth cookies (`sid`/`sls`/`sma`), just against different endpoints
//! (`/inventory`/`/market` here vs. `/gamecards`/`/badges` there). `steam_community` was extracted
//! from `card_farming` (its original, only consumer) once this module needed the identical
//! mechanism.
//!
//! Inventory fetch + cache (`get_inventory`/`get_inventory_cache`/`delete_inventory_cache`) is one
//! command surface via `GamesAccount` + `manual_cookies`, mirroring `card_farming::commands`'s
//! exact shape (see `steam_community::session::resolve`'s doc comment) so this works identically
//! for every sign-in mode and Pro tier without frontend branching. Market actions
//! (`get_item_price`/`list_items`/`update_item_price_data`/`remove_market_listings`) and per-account
//! selling preferences (`settings` - `get_inventory_settings`/`set_inventory_settings`) round out
//! the surface.
//!
//! [`InventoryItem`] is a real typed struct with the usual `#[serde(rename_all = "camelCase")]`
//! rather than an ad hoc untyped JSON blob, so the frontend consumes `fullName`/`marketHashName`/
//! `badgeLevel`/`itemType` like every other feature's types.

pub mod cache;
pub mod commands;
mod market;
mod scraper;
pub mod settings;

use serde::{Deserialize, Serialize};

/// One marketable Steam Community inventory item - trading card, background, emoticon, booster
/// pack, or sale item (all share the same `item_class_N` tag family, listed together rather than
/// cards alone). `price_data` starts absent
/// - populated by [`commands::update_item_price_data`], kept as part of this struct so the on-disk
/// cache format doesn't need to change shape once that command runs.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryItem {
    /// Steam's `classid` - stable identity for one item "kind" (not a specific copy).
    pub id: String,
    /// Steam's `assetid` - identifies one specific copy in the inventory; what market actions key
    /// off of.
    pub assetid: String,
    pub app_id: u32,
    pub image: String,
    pub href: String,
    pub app_name: String,
    pub full_name: String,
    pub market_hash_name: String,
    /// This item's game's badge level for the owning account - applies uniformly across every item
    /// type belonging to that game, not trading cards alone.
    pub badge_level: u32,
    /// Steam's `item_class_N` tag (`item_class_2` = trading card, `_3` = background, `_4` =
    /// emoticon, `_5` = booster pack, `_10` = on sale) - drives the future frontend's type filter.
    pub item_type: String,
    #[serde(default)]
    pub foil: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub price_data: Option<PriceData>,
}

/// Market order-book snapshot for one item - populated by [`commands::get_item_price`]/
/// [`commands::update_item_price_data`].
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceData {
    pub sell_order_graph: Vec<OrderGraphEntry>,
    pub buy_order_graph: Vec<OrderGraphEntry>,
    pub highest_buy_order: Option<f64>,
    pub lowest_sell_order: Option<f64>,
    pub buy_order_summary: String,
    pub sell_order_summary: String,
}

/// `(price, quantity, formatted display label)` - mirrors `main`'s `[price, qty, label]` tuple
/// shape exactly, just typed.
pub type OrderGraphEntry = (f64, u64, String);

/// Outcome of listing one item on the market (`main`'s `list_trading_cards`) - flattens `main`'s ad
/// hoc nested `data` object (Steam's own `sellitem/` response fields) directly onto the result
/// instead of replicating that nesting, same "typed, not ad hoc `Value`" treatment as
/// [`InventoryItem`].
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListingResult {
    pub assetid: String,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default)]
    pub needs_email_confirmation: bool,
    #[serde(default)]
    pub needs_mobile_confirmation: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListItemsResult {
    pub results: Vec<ListingResult>,
    pub total: usize,
    pub successful: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemovedListing {
    pub listing_id: String,
    pub asset_id: String,
    pub success: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveListingsResult {
    pub total_listings: usize,
    pub processed_listings: usize,
    pub results: Vec<RemovedListing>,
    pub successful_removals: usize,
}
