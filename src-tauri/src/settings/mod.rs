use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::fs_utils::atomic_write_json;

pub mod commands;

const SETTINGS_FILE_NAME: &str = "settings.json";

/// Persisted app-wide settings - not scoped to any one Steam account, unlike per-account data
/// (idling/favorites/etc. caches, each keyed by SteamID64). A setting belongs here only if it's a
/// property of the app installation rather than of which Steam account is active; a genuinely
/// per-account setting should get its own steam-id-scoped file instead.
///
/// `agent_accounts` is a roster of agent-mode (SteamKit2) accounts with a saved session -
/// normalized username -> original-cased username. Refresh tokens are bearer credentials, so they
/// live in the OS credential store (see `credential_store`) instead of this plaintext-adjacent
/// JSON file; this roster only tracks *which* accounts have one.
///
/// The user-supplied Steam Web API key override is likewise not a field here - it's a bearer
/// credential too and lives in the credential store (see
/// `credential_store::{save,load,delete}_web_api_key`). See `steam_web_api::resolve_api_key` for
/// the fallback when no override is set.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default)]
    pub agent_accounts: HashMap<String, String>,
    /// "Always Online" anti-away toggle - whether `local_steam::commands::anti_away` should be
    /// invoked periodically by the frontend. Defaults `false`. Not scoped per-account despite only
    /// mattering for a CLI-mode (local Steam client) session - it's a property of this
    /// installation, not of any one Steam account.
    #[serde(default)]
    pub anti_away: bool,
    /// Whether the app window should stay hidden on launch rather than showing/focusing once the
    /// frontend is ready (see `setup_window` in `lib.rs`). Fully hidden, not OS-taskbar-minimized,
    /// so recovering the window depends on the system tray's "Show" item. App-wide for the same
    /// reason as `anti_away`. Defaults `false`.
    #[serde(default)]
    pub start_minimized: bool,
    /// Whether closing the main window hides it to the system tray instead of quitting the process
    /// (`useTitlebar.ts`'s `close` reads this fresh on every close-button click, since the custom
    /// frameless titlebar has no OS close box / `WindowEvent::CloseRequested` to intercept).
    /// App-wide for the same reason as `start_minimized`. Defaults `true` - needs the hand-written
    /// `impl Default` below since a derived `Default` can't express a non-`bool::default()` field.
    #[serde(default = "default_close_to_tray")]
    pub close_to_tray: bool,
    /// Gamer-tier-gated: whether the frontend should silently poll `get_owned_games` for the
    /// active account on an interval instead of only refreshing on account-switch/staleness or a
    /// manual refresh click. Tier enforcement happens entirely on the frontend (`hasGamerAccess`).
    /// Defaults `false`.
    #[serde(default)]
    pub auto_update_games_list: bool,
    /// Whether `free_games::discovery`'s background poll (frontend-driven, see
    /// `useFreeGamesWatcher.ts`) should show an OS notification when a new free game appears -
    /// app-wide rather than per-account since discovery itself has no account concept. Defaults
    /// `true`.
    #[serde(default = "default_free_game_notifications")]
    pub free_game_notifications: bool,
    /// Active theme preset key (`"default"` or a `src/shared/theme/presets.ts` key) - a UI
    /// preference of this installation, not of which Steam account is active. Casual-tier gating
    /// for non-default presets is enforced entirely on the frontend (`hasCasualAccess`). Defaults
    /// `"default"`.
    #[serde(default = "default_theme")]
    pub theme: String,
    /// Filename (not a path) of the active custom background image under
    /// `app_data_dir/customization/`, or `None` if no background is set - see
    /// `customization::set_background`/`clear_background`, which own the actual file on disk. Kept
    /// as just a filename (never a base64 blob) so this JSON file stays small regardless of image
    /// size. Casual-tier gated, same as `theme`. Defaults `None`.
    #[serde(default)]
    pub custom_background: Option<String>,
    /// Global tooltip-visibility override, consumed by `AppTooltip` (the one shared wrapper every
    /// tooltip in the app goes through). Free-tier, unlike `theme`/`custom_background`. Defaults
    /// `false` (tooltips shown), matching `main`.
    #[serde(default)]
    pub disable_tooltips: bool,
    /// Whether the Games List page shows the "Recommended" (unplayed games) carousel - a free-tier
    /// visibility preference, independent of the Casual/Gamer gates above. Defaults `true`,
    /// matching `main`.
    #[serde(default = "default_true")]
    pub show_recommended_carousel: bool,
    /// Whether the Games List page shows the "Recently Played" carousel. Defaults `true`, matching
    /// `main`.
    #[serde(default = "default_true")]
    pub show_recent_carousel: bool,
    /// Active app-wide font key (`"inter"` or a `src/shared/theme/font.ts` `FontPreset` key) - a
    /// UI preference of this installation, matching `theme`. Casual-tier gated the same way. All
    /// fonts are pre-bundled at build time (self-hosted, no runtime network dependency), so
    /// switching never needs a download. Defaults `"inter"`.
    #[serde(default = "default_font")]
    pub font: String,
}

fn default_close_to_tray() -> bool {
    true
}

fn default_free_game_notifications() -> bool {
    true
}

fn default_theme() -> String {
    "default".to_string()
}

fn default_font() -> String {
    "inter".to_string()
}

fn default_true() -> bool {
    true
}

/// Not `#[derive(Default)]` - `close_to_tray` needs to default to `true` (see its own doc
/// comment), which a derived `Default` can't express since it always uses `bool::default()`
/// (`false`) per field regardless of this struct's own `#[serde(default = ...)]` attribute. Kept
/// in sync with `default_close_to_tray` by hand; every other field's default already matches its
/// type's own `Default::default()`.
impl Default for Settings {
    fn default() -> Self {
        Self {
            agent_accounts: HashMap::new(),
            anti_away: false,
            start_minimized: false,
            close_to_tray: default_close_to_tray(),
            auto_update_games_list: false,
            free_game_notifications: default_free_game_notifications(),
            theme: default_theme(),
            custom_background: None,
            disable_tooltips: false,
            show_recommended_carousel: default_true(),
            show_recent_carousel: default_true(),
            font: default_font(),
        }
    }
}

/// `pub(crate)` (not private) since `debug::commands` also needs the raw path, to reveal
/// settings.json in Explorer.
///
/// Routed through `platform::cache_dir` (portable-aware: `<exe_dir>/cache` vs. `<app_data_dir>/
/// cache`), not `app_data_dir()` directly - the latter ignores portable mode entirely, which would
/// leave this file behind in `%APPDATA%` for a portable install instead of next to the exe.
pub(crate) fn settings_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = crate::platform::cache_dir(app_handle).map_err(|e| e.to_string())?;
    Ok(dir.join(SETTINGS_FILE_NAME))
}

pub fn load(app_handle: &tauri::AppHandle) -> Result<Settings, String> {
    let path = settings_path(app_handle)?;
    if !path.exists() {
        return Ok(Settings::default());
    }
    let contents =
        std::fs::read_to_string(&path).map_err(|e| format!("failed to read settings.json: {e}"))?;
    match serde_json::from_str(&contents) {
        Ok(settings) => Ok(settings),
        Err(e) => {
            // A previously-saved settings.json no longer matches this version's shape (most likely
            // an existing key's on-disk type changing under a future update, which #[serde(default)]
            // can't rescue since that only covers a *missing* key). Self-heal to defaults rather
            // than hard-failing every settings read for this installation until a follow-up patch
            // ships - matches every per-account settings module's `read_unlocked` (see
            // `card_farming::settings::read_unlocked`'s doc comment). Logged so a user's log file
            // still shows why settings.json reset.
            tracing::warn!(error = %e, "settings: settings.json failed to parse, resetting to defaults");
            let defaults = Settings::default();
            save(app_handle, &defaults)?;
            Ok(defaults)
        }
    }
}

pub fn save(app_handle: &tauri::AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app_handle)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("failed to create settings directory: {e}"))?;
    }
    atomic_write_json(&path, settings).map_err(|e| format!("failed to write settings.json: {e}"))
}

/// Serializes every settings.json read-modify-write against every other one in this process -
/// `atomic_write_json` alone only guarantees the file itself is never corrupted, not that two
/// concurrent writers (e.g. two `set_*` commands, or `record_agent_account` racing a `set_*` call
/// when a second agent-mode account finishes signing in around the same time another one saves a
/// setting) can't silently clobber each other's change. Mirrors the `WRITE_LOCK` pattern already
/// used by `credential_store` and every per-feature settings/cache file (e.g.
/// `achievement_unlocker::settings`).
static WRITE_LOCK: Mutex<()> = Mutex::new(());

fn mutate(
    app_handle: &tauri::AppHandle,
    f: impl FnOnce(&mut Settings),
) -> Result<Settings, String> {
    let _guard = WRITE_LOCK.lock().unwrap();
    let mut settings = load(app_handle)?;
    f(&mut settings);
    save(app_handle, &settings)?;
    Ok(settings)
}

/// Records that `username` has a saved agent-mode session, leaving every other saved account
/// untouched. Call only *after* the refresh token itself has been saved to the OS credential
/// store, so the roster never claims a saved session that doesn't actually have a retrievable
/// token behind it.
pub fn record_agent_account(app_handle: &tauri::AppHandle, username: &str) -> Result<(), String> {
    mutate(app_handle, |settings| {
        settings
            .agent_accounts
            .insert(username.trim().to_lowercase(), username.trim().to_string());
    })?;
    Ok(())
}

/// Sets the "Always Online" anti-away toggle. See [`Settings::anti_away`] for why this is
/// app-wide rather than per-account.
pub fn set_anti_away(app_handle: &tauri::AppHandle, enabled: bool) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.anti_away = enabled)
}

/// Sets the "start minimized" toggle. See [`Settings::start_minimized`] for why this is app-wide
/// rather than per-account.
pub fn set_start_minimized(
    app_handle: &tauri::AppHandle,
    enabled: bool,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.start_minimized = enabled)
}

/// Sets the "close to tray" toggle. See [`Settings::close_to_tray`] for why this is app-wide
/// rather than per-account.
pub fn set_close_to_tray(app_handle: &tauri::AppHandle, enabled: bool) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.close_to_tray = enabled)
}

/// Sets the auto-update-games-list toggle. See [`Settings::auto_update_games_list`] - tier
/// enforcement is the frontend's responsibility, not this command's.
pub fn set_auto_update_games_list(
    app_handle: &tauri::AppHandle,
    enabled: bool,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| {
        settings.auto_update_games_list = enabled
    })
}

/// Sets the free-game-notifications toggle. See [`Settings::free_game_notifications`] for why
/// this is app-wide rather than per-account.
pub fn set_free_game_notifications(
    app_handle: &tauri::AppHandle,
    enabled: bool,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| {
        settings.free_game_notifications = enabled
    })
}

/// Sets the active theme preset key. See [`Settings::theme`] - tier enforcement is the frontend's
/// responsibility, not this command's (same as every other Pro-gated field).
pub fn set_theme(app_handle: &tauri::AppHandle, theme: String) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.theme = theme)
}

/// Sets the active font key. See [`Settings::font`] - tier enforcement is the frontend's
/// responsibility, not this command's (same as every other Pro-gated field).
pub fn set_font(app_handle: &tauri::AppHandle, font: String) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.font = font)
}

/// Sets or clears the custom-background filename. `pub(crate)`, not `pub` - only
/// `customization::set_background`/`clear_background` should call this, always immediately after
/// the actual file on disk is written/removed, so this field never points at a file that doesn't
/// exist.
pub(crate) fn set_custom_background(
    app_handle: &tauri::AppHandle,
    filename: Option<String>,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.custom_background = filename)
}

/// Sets the global disable-tooltips toggle. See [`Settings::disable_tooltips`].
pub fn set_disable_tooltips(
    app_handle: &tauri::AppHandle,
    enabled: bool,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| settings.disable_tooltips = enabled)
}

/// Sets the "show Recommended carousel" toggle. See [`Settings::show_recommended_carousel`].
pub fn set_show_recommended_carousel(
    app_handle: &tauri::AppHandle,
    enabled: bool,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| {
        settings.show_recommended_carousel = enabled
    })
}

/// Sets the "show Recently Played carousel" toggle. See [`Settings::show_recent_carousel`].
pub fn set_show_recent_carousel(
    app_handle: &tauri::AppHandle,
    enabled: bool,
) -> Result<Settings, String> {
    mutate(app_handle, |settings| {
        settings.show_recent_carousel = enabled
    })
}

/// Resets every app-wide preference back to its default, for `debug::commands::reset_settings`.
/// Deliberately preserves `agent_accounts` - that's the saved-session roster (authentication
/// state), not a user preference, and a settings reset should never sign anyone out. Does not
/// touch the Steam Web API key override (a bearer credential in the OS credential store, not this
/// file) or the custom background image file on disk - the caller is responsible for clearing
/// those separately (see `reset_settings`'s own doc comment).
pub fn reset(app_handle: &tauri::AppHandle) -> Result<Settings, String> {
    mutate(app_handle, |settings| {
        let agent_accounts = std::mem::take(&mut settings.agent_accounts);
        *settings = Settings::default();
        settings.agent_accounts = agent_accounts;
    })
}
