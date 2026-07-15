//! Per-account inventory selling preferences: sell-price preference, price adjustment, sell-price
//! limits, delay between listings, market currency. Named `InventorySettings`, not
//! `TradingCardsSettings`, since these preferences govern selling *whatever* gets listed through
//! inventory-manager generally, not trading cards specifically (see `mod.rs`'s doc comment).
//!
//! A typed struct with a whole-object get/set, not a shared dot-path settings blob - same pattern
//! `achievement_unlocker::settings` uses. Own file (`inventory_settings.json`) in the same
//! per-SteamID64 directory `cache.rs`'s `inventory.json` already uses, own `tokio::sync::Mutex`.

use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const SETTINGS_FILE_NAME: &str = "inventory_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// Which side of the order book to prefer when a price is auto-filled for listing - `main`'s
/// `sellOptions: 'highestBuyOrder' | 'lowestSellOrder'`, renamed/typed as a real enum instead of a
/// loose string union (a small clarity improvement, unrelated to the card/item naming fix above -
/// this field was never card-specific).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PricePreference {
    HighestBuyOrder,
    LowestSellOrder,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SellLimit {
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventorySettings {
    pub price_preference: PricePreference,
    /// Flat amount added to whatever price was auto-filled/entered before listing.
    pub price_adjustment: f64,
    /// A listing is only submitted if its final (adjusted) price falls within this range.
    pub sell_limit: SellLimit,
    /// Seconds to wait between consecutive listing requests in a bulk sell.
    pub sell_delay: f64,
    /// Steam currency ID (as a string, matching `market::get_item_price`/`market::list_items`'s
    /// `currency` parameter and Steam's own `eCurrency` values - e.g. "1" = USD, "3" = EUR).
    /// `main`'s equivalent (`tradingCards.currency`) lived in `localStorage`, not its per-account
    /// settings blob - this rewrite keeps it in `InventorySettings` instead, consistent with every
    /// other per-account preference in this file. `default = "default_currency"` (not the bare
    /// `#[serde(default)]` this file's other fields use) so an `inventory_settings.json` written
    /// before this field existed deserializes to "1" (USD) rather than an empty string.
    #[serde(default = "default_currency")]
    pub currency: String,
}

fn default_currency() -> String {
    "1".to_string()
}

impl Default for InventorySettings {
    /// Mirrors `main`'s `userStore.ts` `tradingCards` defaults exactly, so an account migrating
    /// from `main`'s behavior sees the same starting point.
    fn default() -> Self {
        Self {
            price_preference: PricePreference::HighestBuyOrder,
            price_adjustment: 0.0,
            sell_limit: SellLimit {
                min: 0.01,
                max: 10.0,
            },
            sell_delay: 10.0,
            currency: "1".to_string(),
        }
    }
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct CachedSettings {
    #[serde(default)]
    settings: InventorySettings,
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<CachedSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(CachedSettings::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::InventorySettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(CachedSettings::default());
    }

    match serde_json::from_str(&contents) {
        Ok(cached) => Ok(cached),
        Err(e) => {
            // Self-heal to defaults rather than hard-failing every read for this account - see
            // `card_farming::settings::read_unlocked`'s matching comment for why.
            tracing::warn!(
                steam_id,
                error = %e,
                "inventory: inventory_settings.json failed to parse, resetting to defaults"
            );
            let defaults = CachedSettings::default();
            write_unlocked(app_handle, steam_id, &defaults)?;
            Ok(defaults)
        }
    }
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    cached: &CachedSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::InventorySettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, cached).map_err(|e| AppError::InventorySettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<InventorySettings> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?.settings)
}

/// Whole-struct replace, not a dot-path merge - the frontend always has the full settings object on
/// hand (it just fetched it via `get`), so there's no partial-update case to support.
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: InventorySettings,
) -> AppResult<InventorySettings> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    cached.settings = settings;
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.settings)
}
