//! Per-account card-farming settings - separate from `manager`/`scraper` (the farming cycle itself)
//! and from `blacklist`/`whitelist` (their own files). Persisted to its own file in the same
//! per-SteamID64 directory `achievement_unlocker::settings` uses this same pattern for (own typed
//! struct, own file, whole-struct get/set) rather than a shared dot-path settings blob.
//!
//! **No auto-stop caps live here anymore.** A pre-rewrite version of this feature had per-game/
//! global max-farming-time and max-card-drops caps, tracked as sibling fields alongside
//! `CardFarmingSettings` on a private wrapper struct. They were removed entirely: their "elapsed
//! since this game entered `active`" semantics stopped meaning anything coherent once farming
//! started stopping/restarting a game every few minutes and bouncing between phases (see
//! `manager`'s module doc comment) - a deliberate simplification, not an oversight.
//! [`read_unlocked`] still recognizes the old on-disk wrapper shape well enough to migrate an
//! existing file forward (discarding the caps, which have nowhere left to go).
//!
//! **`auto_farm_cards`** is the gamer-tier-gated automation toggle read back by
//! `useAutoFarmCards.ts` (mounted in `DashboardShell`) - purely a persisted flag, no Rust-side
//! automation or tier enforcement lives here.

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

fn default_hours_until_farmable() -> u32 {
    3
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardFarmingSettings {
    /// Skip games with zero recorded playtime.
    pub skip_no_playtime: bool,
    /// Only farm games that have never been played.
    pub farm_unplayed_only: bool,
    pub next_task_checkbox: bool,
    /// What to start once farming finishes: `"achievementUnlocker"` or `"autoIdle"` - see
    /// `achievement_unlocker::settings::AchievementUnlockerSettings::next_task`'s doc comment for
    /// why this stays a loose string rather than an enum.
    pub next_task: Option<String>,
    /// Gamer-tier automation toggle - see this module's doc comment. `#[serde(default)]` so an
    /// existing on-disk settings file (serialized before this field existed) still deserializes.
    #[serde(default)]
    pub auto_farm_cards: bool,
    /// Whether the user has dismissed the one-time "farming multiple games at once can slow down
    /// drops" notice shown from the `allowMultiGameFarming` settings toggle - never re-shown once
    /// true. `#[serde(default)]` so an existing on-disk settings file (serialized before this field
    /// existed) still deserializes.
    #[serde(default)]
    pub multi_game_farming_notice_seen: bool,
    /// When on, farming skips any game still inside Steam's refund window - purchased via a real
    /// monetary payment method within the last [`crate::card_farming::refund_window::REFUND_WINDOW_DAYS`]
    /// days, with under [`crate::card_farming::refund_window::REFUND_WINDOW_MAX_PLAYTIME_MINUTES`]
    /// minutes of recorded playtime - so idling for card drops doesn't quietly burn through the
    /// refund eligibility of a game the user might still want their money back on.
    ///
    /// Agent-mode only: the purchase-date data this relies on
    /// (`games::OwnedGame::last_refund_eligible_purchase_unix_seconds`) only ever comes from the
    /// SteamKit2 daemon's license list - CLI mode's local-client backend has no equivalent API
    /// surface at all. A CLI-mode account with this on is a silent no-op (every game's purchase
    /// data is `None`, so nothing ever matches), never an error - matches this project's fail-open
    /// convention for missing per-app data rather than adding account-mode branching here.
    ///
    /// Re-evaluated live on every outer-loop iteration (`manager::resolve_candidates`), not decided
    /// once, since both the 14-day and playtime thresholds change while a session runs.
    ///
    /// `#[serde(default)]` so an existing on-disk settings file (serialized before this field
    /// existed) still deserializes.
    #[serde(default)]
    pub skip_refundable_games: bool,
    /// Opt-in: when on, the ready-farm phase targets every currently-ready game simultaneously
    /// instead of solo-targeting just the one with the fewest drops remaining. Idling more than one
    /// game with real card drops remaining at once measurably collapses each one's drop rate, so
    /// this is off by default and gated behind a one-time warning (see `multi_game_farming_notice_seen`)
    /// before it can be turned on. `#[serde(default)]` so an existing on-disk settings file
    /// (serialized before this field existed) still deserializes - `false` correctly matches the
    /// new default for every such user regardless of what an old, now-removed `single_farming_mode`
    /// field might have held, since that field's `false` meant the opposite thing (uncapped
    /// concurrency) under the pre-rewrite model.
    #[serde(default)]
    pub allow_multi_game_farming: bool,
    /// Hours of playtime a game needs before its card drops are considered reachable - the
    /// ready-vs-accumulating classification threshold (see `manager`'s module doc comment).
    /// User-configurable since the real Steam-side threshold varies by account. Defaults to `3` via
    /// a named default function, not a bare `#[serde(default)]` (which would silently give every
    /// upgrading user `0`, defeating the threshold entirely for anyone with an existing settings
    /// file predating this field).
    #[serde(default = "default_hours_until_farmable")]
    pub hours_until_farmable: u32,
}

impl Default for CardFarmingSettings {
    fn default() -> Self {
        Self {
            skip_no_playtime: false,
            farm_unplayed_only: false,
            next_task_checkbox: false,
            next_task: None,
            auto_farm_cards: false,
            multi_game_farming_notice_seen: false,
            skip_refundable_games: false,
            allow_multi_game_farming: false,
            hours_until_farmable: default_hours_until_farmable(),
        }
    }
}

/// Pre-rewrite on-disk shape - `CardFarmingSettings` used to live nested under `.settings` alongside
/// sibling auto-stop-cap fields on this wrapper. Recognized here purely so [`read_unlocked`] can
/// migrate an existing file forward; the caps themselves have no home to migrate into and are
/// discarded (see this module's doc comment).
#[derive(Debug, Default, Deserialize)]
struct LegacyCachedSettings {
    #[serde(default)]
    settings: CardFarmingSettings,
}

fn settings_file_path(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join(SETTINGS_FILE_NAME))
}

/// Tries the current flat `CardFarmingSettings` shape first; falls back to the pre-rewrite nested
/// `LegacyCachedSettings` shape (see that struct's doc comment) so an existing on-disk file keeps
/// loading - migrated forward into the new flat shape on the next write - instead of erroring or
/// silently resetting.
fn read_unlocked(app_handle: &AppHandle, steam_id: &str) -> AppResult<CardFarmingSettings> {
    let path = settings_file_path(app_handle, steam_id)?;
    if !path.exists() {
        return Ok(CardFarmingSettings::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|e| AppError::CardFarmingSettingsIo(e.to_string()))?;
    if contents.trim().is_empty() {
        return Ok(CardFarmingSettings::default());
    }

    if let Ok(settings) = serde_json::from_str::<CardFarmingSettings>(&contents) {
        return Ok(settings);
    }
    if let Ok(legacy) = serde_json::from_str::<LegacyCachedSettings>(&contents) {
        tracing::info!(
            steam_id,
            "card farming: migrated settings from the pre-rewrite cached-caps shape"
        );
        write_unlocked(app_handle, steam_id, &legacy.settings)?;
        return Ok(legacy.settings);
    }

    // Neither shape parses - most likely a future update changed an existing key's on-disk type
    // (#[serde(default)] only rescues a *missing* key, not a present-but-wrong-shape one).
    // Self-heal to defaults rather than hard-failing every read for this account until a follow-up
    // patch ships - every other per-account settings module's `read_unlocked` mirrors this. Logged
    // so a user's log file still shows why their card-farming settings reset.
    tracing::warn!(
        steam_id,
        "card farming: card_farming_settings.json failed to parse, resetting to defaults"
    );
    let defaults = CardFarmingSettings::default();
    write_unlocked(app_handle, steam_id, &defaults)?;
    Ok(defaults)
}

fn write_unlocked(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: &CardFarmingSettings,
) -> AppResult<()> {
    let path = settings_file_path(app_handle, steam_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::CardFarmingSettingsIo(e.to_string()))?;
    }
    atomic_write_json(&path, settings).map_err(|e| AppError::CardFarmingSettingsIo(e.to_string()))
}

pub async fn get(app_handle: &AppHandle, steam_id: &str) -> AppResult<CardFarmingSettings> {
    let _guard = WRITE_LOCK.lock().await;
    read_unlocked(app_handle, steam_id)
}

/// Whole-struct replace, not a dot-path merge - see `achievement_unlocker::settings::set`'s doc
/// comment for why (the frontend always has the full settings object on hand already).
pub async fn set(
    app_handle: &AppHandle,
    steam_id: &str,
    settings: CardFarmingSettings,
) -> AppResult<CardFarmingSettings> {
    let _guard = WRITE_LOCK.lock().await;
    write_unlocked(app_handle, steam_id, &settings)?;
    Ok(settings)
}

/// For the Debug tab's "Reset Settings" action.
pub async fn reset(app_handle: &AppHandle, steam_id: &str) -> AppResult<CardFarmingSettings> {
    let _guard = WRITE_LOCK.lock().await;
    let defaults = CardFarmingSettings::default();
    write_unlocked(app_handle, steam_id, &defaults)?;
    Ok(defaults)
}
