//! Per-account card-farming settings (queue-building/sort/skip toggles and next-task chaining) -
//! separate from `manager`/`scraper` (the farming cycle itself) and from `blacklist` (its own
//! file). Persisted to its own file in the same per-SteamID64 directory
//! `achievement_unlocker::settings` uses this same pattern for (own typed struct, own file,
//! whole-struct get/set) rather than a shared dot-path settings blob.
//!
//! **`auto_farm_cards`** is the gamer-tier-gated automation toggle read back by
//! `useAutoFarmCards.ts` (mounted in `DashboardShell`) - purely a persisted flag, no Rust-side
//! automation or tier enforcement lives here. `#[serde(default)]` specifically (not just on the
//! outer struct) because every on-disk `card_farming_settings.json` predating this field is a full
//! serialization without it - omitting the attribute would fail deserialization for existing users.
//!
//! **Most of `CardFarmingSettings`'s own fields still aren't wired into `manager`'s farming
//! cycle** - `list_games`/`drop_sort_order`/`next_task*`/`auto_farm_cards` only affect the
//! settings UI, queue sort order, and next-task chaining, matching `main`'s own split between its
//! CardSettings.tsx toggles and its separate GameSettings.tsx caps. **`all_games`,
//! `skip_no_playtime`, and `farm_unplayed_only` are the exception**: `commands::start_farming`
//! reads them directly (not through `manager`) to decide what to farm *before* a cycle ever starts
//! - when `all_games` is on, the persisted queue is bypassed entirely in favor of every owned game
//! with drops remaining, filtered by the other two (see `commands::resolve_all_games`).
//! Once a cycle is running, `manager`/`scraper` still don't re-read any of these three - the
//! resolved app ID set is fixed for the cycle's lifetime, same as queue-mode's persisted queue
//! always was.
//!
//! **Auto-stop caps (`globalMaxCardFarmingTime`/`maxCardDrops`/`maxCardFarmingTime`) live in
//! [`CachedSettings`], not in [`CardFarmingSettings`].** `CardFarmingSettings` is wholesale-replaced
//! by [`set`] every time `CardFarmingSettingsTab`'s own Save button fires - if the caps lived there
//! too, a save from that unrelated tab could silently wipe them out any time its frontend payload
//! didn't happen to carry them forward. Keeping them as sibling fields on the private
//! `CachedSettings` wrapper (mirroring `achievement_unlocker::settings`'s
//! `per_game_max_unlocks` split) means [`set`] only ever touches `.settings`, exactly like
//! `achievement_unlocker::settings::set` only ever touches its own `.settings` field.

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const SETTINGS_FILE_NAME: &str = "card_farming_settings.json";

static WRITE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// Which end of the drops-remaining range to farm first - was two mutually-exclusive booleans
/// (`sort_by_highest_drops`/`sort_by_lowest_drops`, one always forced off when the other turned
/// on), collapsed into a real enum matching `inventory::settings::PricePreference`'s pattern (a
/// two-option preference that's always exactly one value, never both-off/both-on).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DropSortOrder {
    #[default]
    HighestFirst,
    LowestFirst,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardFarmingSettings {
    /// Show the drops-remaining count next to each game in the farming list.
    pub list_games: bool,
    /// Consider every owned game for drops, not just ones already known to have cards.
    pub all_games: bool,
    /// Skip games with zero recorded playtime.
    pub skip_no_playtime: bool,
    /// Only farm games that have never been played.
    pub farm_unplayed_only: bool,
    /// `#[serde(default)]` so an on-disk `card_farming_settings.json` predating this field (the old
    /// two-boolean shape) still deserializes instead of hard-failing to load - same convention as
    /// `auto_farm_cards` below.
    #[serde(default)]
    pub drop_sort_order: DropSortOrder,
    pub next_task_checkbox: bool,
    /// What to start once farming finishes: `"achievementUnlocker"` or `"autoIdle"` - see
    /// `achievement_unlocker::settings::AchievementUnlockerSettings::next_task`'s doc comment for
    /// why this stays a loose string rather than an enum.
    pub next_task: Option<String>,
    /// Gamer-tier automation toggle - see this module's doc comment. `#[serde(default)]` so an
    /// existing on-disk settings file (serialized before this field existed) still deserializes.
    #[serde(default)]
    pub auto_farm_cards: bool,
}

impl Default for CardFarmingSettings {
    /// Mirrors `main`'s `userStore.ts` `cardFarming` defaults exactly, so an account migrating
    /// from `main`'s behavior sees the same starting point.
    fn default() -> Self {
        Self {
            list_games: false,
            all_games: true,
            skip_no_playtime: false,
            farm_unplayed_only: false,
            drop_sort_order: DropSortOrder::HighestFirst,
            next_task_checkbox: false,
            next_task: None,
            auto_farm_cards: false,
        }
    }
}

/// Persisted shape - see this module's doc comment for why the auto-stop caps are sibling fields
/// here rather than living on [`CardFarmingSettings`] itself.
#[derive(Debug, Default, Serialize, Deserialize)]
struct CachedSettings {
    #[serde(default)]
    settings: CardFarmingSettings,
    #[serde(default)]
    global_max_card_farming_time: u32,
    #[serde(default)]
    per_game_max_card_drops: HashMap<u32, u32>,
    #[serde(default)]
    per_game_max_card_farming_time: HashMap<u32, u32>,
}

/// The auto-stop caps that actually apply to one game right now - bundles a single
/// `settings::get_caps` read so `manager::run_cycle`'s poll loop does one lock acquisition per
/// interval instead of three. `Default` (uncapped) backs `run_cycle`'s fallback if a settings read
/// ever fails - a farming cycle shouldn't die over a cap-lookup error.
#[derive(Default)]
pub struct FarmingCaps {
    pub global_max_card_farming_time: u32,
    pub per_game_max_card_drops: HashMap<u32, u32>,
    pub per_game_max_card_farming_time: HashMap<u32, u32>,
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

/// Tries the current `CachedSettings` shape first; falls back to the older bare
/// `CardFarmingSettings` shape (what every file on disk before this step used) and wraps it with
/// empty caps, so an existing e2e-tested dev-machine file keeps loading instead of erroring or
/// silently resetting.
fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<CachedSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(CachedSettings::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::CardFarmingSettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(CachedSettings::default());
    }

    if let Ok(cached) = serde_json::from_str::<CachedSettings>(&contents) {
        return Ok(cached);
    }
    if let Ok(settings) = serde_json::from_str::<CardFarmingSettings>(&contents) {
        return Ok(CachedSettings {
            settings,
            ..Default::default()
        });
    }

    // Neither the current CachedSettings shape nor the legacy bare-struct shape parses - most
    // likely a future update changed an existing key's on-disk type (#[serde(default)] only
    // rescues a *missing* key, not a present-but-wrong-shape one). Self-heal to defaults rather
    // than hard-failing every read for this account until a follow-up patch ships - every other
    // per-account settings module's `read_unlocked` mirrors this. Logged so a user's log file still
    // shows why their card-farming settings reset.
    tracing::warn!(
        steam_id,
        "card farming: card_farming_settings.json failed to parse, resetting to defaults"
    );
    let defaults = CachedSettings::default();
    write_unlocked(app_handle, steam_id, &defaults)?;
    Ok(defaults)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    cached: &CachedSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::CardFarmingSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, cached).map_err(|e| AppError::CardFarmingSettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<CardFarmingSettings> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?.settings)
}

/// Whole-struct replace, not a dot-path merge - see `achievement_unlocker::settings::set`'s doc
/// comment for why (the frontend always has the full settings object on hand already). Only ever
/// touches `.settings` - the auto-stop caps are untouched, same as
/// `achievement_unlocker::settings::set` leaving `.per_game_max_unlocks` alone.
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: CardFarmingSettings,
) -> AppResult<CardFarmingSettings> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    cached.settings = settings;
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.settings)
}

pub async fn get_global_max_card_farming_time(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<u32> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?.global_max_card_farming_time)
}

pub async fn set_global_max_card_farming_time(
    app_handle: &AppHandle,
    steam_id: &str,
    minutes: u32,
) -> AppResult<u32> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    cached.global_max_card_farming_time = minutes;
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.global_max_card_farming_time)
}

pub async fn get_max_card_drops(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_card_drops
        .get(&app_id)
        .copied())
}

/// `max_card_drops: None` clears the override - same "absence means no override" convention as
/// `achievement_unlocker::settings::set_max_unlocks`.
pub async fn set_max_card_drops(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    max_card_drops: Option<u32>,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    match max_card_drops {
        Some(value) => {
            cached.per_game_max_card_drops.insert(app_id, value);
        }
        None => {
            cached.per_game_max_card_drops.remove(&app_id);
        }
    }
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(max_card_drops)
}

pub async fn get_max_card_farming_time(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    Ok(read_unlocked(app_handle, steam_id)?
        .per_game_max_card_farming_time
        .get(&app_id)
        .copied())
}

pub async fn set_max_card_farming_time(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    max_card_farming_time: Option<u32>,
) -> AppResult<Option<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    let mut cached = read_unlocked(app_handle, steam_id)?;
    match max_card_farming_time {
        Some(value) => {
            cached.per_game_max_card_farming_time.insert(app_id, value);
        }
        None => {
            cached.per_game_max_card_farming_time.remove(&app_id);
        }
    }
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(max_card_farming_time)
}

/// Bundles all three caps for `manager::run_cycle`'s poll loop - see [`FarmingCaps`]'s doc comment.
pub async fn get_caps(app_handle: &AppHandle, steam_id: &str) -> AppResult<FarmingCaps> {
    let _guard = WRITE_LOCK.lock().await;
    let cached = read_unlocked(app_handle, steam_id)?;
    Ok(FarmingCaps {
        global_max_card_farming_time: cached.global_max_card_farming_time,
        per_game_max_card_drops: cached.per_game_max_card_drops,
        per_game_max_card_farming_time: cached.per_game_max_card_farming_time,
    })
}

/// App IDs with an active per-game override in *either* cap - see
/// `idling::settings::customized_app_ids`'s doc comment for why each map's keys alone are the
/// answer; this module just has two such maps to union instead of one.
pub async fn customized_app_ids(app_handle: &AppHandle, steam_id: &str) -> AppResult<Vec<u32>> {
    let _guard = WRITE_LOCK.lock().await;
    let cached = read_unlocked(app_handle, steam_id)?;
    let mut app_ids: HashSet<u32> = cached.per_game_max_card_drops.into_keys().collect();
    app_ids.extend(cached.per_game_max_card_farming_time.into_keys());
    Ok(app_ids.into_iter().collect())
}

/// Clears `.settings` *and* the global/per-game auto-stop caps, for the Debug tab's "Reset
/// Settings" action - unlike [`set`] (which deliberately only touches `.settings`, see this
/// module's doc comment), a full reset needs to wipe the caps too or a game's override would
/// silently survive the reset.
pub async fn reset(app_handle: &AppHandle, steam_id: &str) -> AppResult<CardFarmingSettings> {
    let _guard = WRITE_LOCK.lock().await;
    let cached = CachedSettings::default();
    write_unlocked(app_handle, steam_id, &cached)?;
    Ok(cached.settings)
}
