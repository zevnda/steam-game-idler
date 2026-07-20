use serde::Serialize;

/// Errors raised by the Rust side of the Steam agent integration.
///
/// Mirrors `libs/SteamUtility/Core/Errors`'s split: a stable string code is what crosses the
/// Tauri command boundary to the frontend (via `Serialize`), while the full `Display` detail
/// (including wrapped IO/JSON errors) goes to the structured log. Domain errors that SteamUtility
/// itself already reports (via the IPC envelope's `error` field) are forwarded verbatim through
/// `Agent` rather than re-coded, so existing string-matching on the frontend (once built) can key
/// off the same codes SteamUtility documents.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("steam_utility_exe_not_found: {0}")]
    SteamUtilityExeNotFound(String),

    #[error("failed to spawn SteamUtility.exe: {0}")]
    ProcessSpawn(#[from] std::io::Error),

    #[error("no active agent session for this account")]
    SessionNotFound,

    #[error("no saved credentials for this account")]
    NoSavedAccount,

    #[error("OS credential store error: {0}")]
    CredentialStore(String),

    #[error("agent process exited before responding")]
    ProcessExited,

    #[error("timed out waiting for a response from SteamUtility.exe")]
    RequestTimeout,

    #[error("failed to (de)serialize IPC message: {0}")]
    Json(#[from] serde_json::Error),

    #[error("{0}")]
    Agent(String),

    #[error("could not locate a local Steam installation: {0}")]
    SteamNotFound(String),

    #[error("failed to read/write loginusers.vdf: {0}")]
    LoginVdfIo(String),

    #[error("failed to parse loginusers.vdf: {0}")]
    LoginVdfParse(String),

    #[error("Steam ID {0} was not found in loginusers.vdf")]
    SteamIdNotFound(String),

    #[error("failed to update the AutoLoginUser registry value: {0}")]
    RegistryUpdate(String),

    #[error("failed to spawn a local process: {0}")]
    LocalProcessSpawn(String),

    #[error("Steam Web API request failed: {0}")]
    SteamApiRequest(String),

    #[error("Steam Web API returned an unexpected response: {0}")]
    SteamApiResponse(String),

    #[error("no Steam Web API key was provided or available")]
    MissingApiKey,

    #[error("failed to read/write the user summary cache: {0}")]
    SummaryCacheIo(String),

    #[error("failed to resolve an application path: {0}")]
    PathResolution(String),

    #[error("no resolved SteamID64 yet for this agent-mode account")]
    AgentSteamIdUnknown,

    #[error("failed to read/write the owned games cache: {0}")]
    GamesCacheIo(String),

    #[error("CLI-mode idle process for app {app_id} failed to start: {reason}")]
    IdleProcessStartFailed { app_id: u32, reason: String },

    #[error("failed to read/write the favorites cache: {0}")]
    FavoritesCacheIo(String),

    #[error("failed to read/write the auto-idle cache: {0}")]
    AutoIdleCacheIo(String),

    #[error("failed to read/write the achievement-unlocker queue cache: {0}")]
    AchievementUnlockerQueueCacheIo(String),

    #[error("failed to read/write the card-farming queue cache: {0}")]
    CardFarmingQueueCacheIo(String),

    #[error("failed to read/write the card-farming blacklist cache: {0}")]
    CardFarmingBlacklistCacheIo(String),

    #[error("failed to read/write the achievement-unlocker settings cache: {0}")]
    AchievementUnlockerSettingsIo(String),

    #[error("failed to read/write the presence settings cache: {0}")]
    PresenceSettingsIo(String),

    #[error("failed to read/write a custom achievement order file: {0}")]
    AchievementOrderIo(String),

    #[error("the requested Steam profile is private or has no public achievement data")]
    PlayerProfilePrivate,

    #[error(
        "the requested Steam profile has no achievements with unlock timestamps for this game"
    )]
    PlayerNoTimestamps,

    #[error("could not resolve \"{0}\" to a Steam profile")]
    PlayerProfileNotFound(String),

    #[error("failed to fetch/parse the free games list: {0}")]
    FreeGamesScrapeFailed(String),

    #[error("Steam store sign-in failed: {0}")]
    StoreLoginFailed(String),

    #[error("failed to claim free game via the Steam store: {0}")]
    StoreClaimFailed(String),

    #[error("Steam store sign-out failed: {0}")]
    StoreLogoutFailed(String),

    #[error("failed to read/write the free-games settings cache: {0}")]
    FreeGamesSettingsIo(String),

    #[error("failed to read/write settings.json: {0}")]
    SettingsIo(String),

    #[error("failed to read a stable device identifier: {0}")]
    DeviceFingerprint(String),

    /// Renamed from `CardFarmingSessionFailed` when the Steam Community session/cookie-acquisition
    /// logic it backs moved out of `card_farming` into the shared `steam_community` module (see
    /// that module's doc comment) - `inventory` now surfaces this too, not just card farming.
    #[error("Steam Community session acquisition failed: {0}")]
    SteamCommunitySessionFailed(String),

    /// A resolved cookie set (manually-pasted, or previously webview-acquired) no longer
    /// authenticates against Steam Community - distinct from `SteamCommunitySessionFailed` so the
    /// frontend can tell "genuinely expired, saved credentials were cleared, please reconnect"
    /// apart from a transient/inconclusive check. See `steam_community::session::ensure_valid`'s
    /// doc comment. Carries the steam_id purely for the log line the frontend error string ends up
    /// duplicating into devtools - not otherwise used.
    #[error("Steam Community session expired for {0}")]
    SteamCommunitySessionExpired(String),

    #[error("failed to fetch/parse card-drop data: {0}")]
    CardFarmingScrapeFailed(String),

    /// A domain error code from a CLI-mode one-shot `SteamUtility.exe` command's JSON envelope
    /// (e.g. `achievement_protected`, `unsupported_game_coordinator`), forwarded verbatim - same
    /// passthrough behavior as `Agent`, kept as a separate variant so log lines can still tell
    /// which backend a given code came from.
    #[error("{0}")]
    SteamUtility(String),

    #[error("failed to fetch/parse trading card inventory: {0}")]
    InventoryFetchFailed(String),

    #[error("failed to read/write the trading card inventory cache: {0}")]
    InventoryCacheIo(String),

    #[error("failed to fetch/parse market price data: {0}")]
    MarketPriceFetchFailed(String),

    #[error("Steam Community rate-limited the market price request")]
    MarketPriceRateLimited,

    #[error("no cached item with market_hash_name \"{0}\" was found")]
    InventoryItemNotFound(String),

    #[error("failed to fetch/parse active market listings: {0}")]
    MarketListingsFetchFailed(String),

    #[error("failed to read/write the inventory settings cache: {0}")]
    InventorySettingsIo(String),

    #[error("failed to read/write the card-farming settings cache: {0}")]
    CardFarmingSettingsIo(String),

    #[error("failed to read/write the idling settings cache: {0}")]
    IdlingSettingsIo(String),

    #[error("failed to read/write the max playtime settings cache: {0}")]
    MaxPlaytimeSettingsIo(String),

    #[error("this game has already reached its max playtime cap")]
    MaxPlaytimeCapReached,

    #[error("failed to read/write the log file: {0}")]
    LogIo(String),

    #[error("failed to clear the cache directory: {0}")]
    CacheClearIo(String),

    #[error("failed to read/write saved Steam Community credentials: {0}")]
    SteamCredentialsStoreIo(String),

    #[error("failed to set webview zoom factor: {0}")]
    ZoomFactorFailed(String),

    #[error("invalid custom background image: {0}")]
    CustomBackgroundInvalid(String),

    #[error("failed to read/write the custom background image: {0}")]
    CustomBackgroundIo(String),
}

impl AppError {
    /// The stable code surfaced to the frontend - matches the `error` string codes SteamUtility's
    /// own envelope already uses for `AppError::Agent`, and a `snake_case` code of its own for
    /// every Rust-side failure mode so the frontend never has to distinguish "who" produced it.
    pub fn code(&self) -> String {
        match self {
            AppError::SteamUtilityExeNotFound(_) => "steam_utility_exe_not_found".to_string(),
            AppError::ProcessSpawn(_) => "agent_process_spawn_failed".to_string(),
            AppError::SessionNotFound => "agent_session_not_found".to_string(),
            AppError::NoSavedAccount => "agent_no_saved_credentials".to_string(),
            AppError::CredentialStore(_) => "agent_credential_store_error".to_string(),
            AppError::ProcessExited => "agent_process_exited".to_string(),
            AppError::RequestTimeout => "agent_request_timeout".to_string(),
            AppError::Json(_) => "agent_ipc_malformed".to_string(),
            AppError::Agent(code) => code.clone(),
            AppError::SteamNotFound(_) => "steam_not_found".to_string(),
            AppError::LoginVdfIo(_) => "login_vdf_io_failed".to_string(),
            AppError::LoginVdfParse(_) => "login_vdf_parse_failed".to_string(),
            AppError::SteamIdNotFound(_) => "steam_id_not_found".to_string(),
            AppError::RegistryUpdate(_) => "registry_update_failed".to_string(),
            AppError::LocalProcessSpawn(_) => "local_process_spawn_failed".to_string(),
            AppError::SteamApiRequest(_) => "steam_api_request_failed".to_string(),
            AppError::SteamApiResponse(_) => "steam_api_response_invalid".to_string(),
            AppError::MissingApiKey => "steam_api_key_missing".to_string(),
            AppError::SummaryCacheIo(_) => "user_summary_cache_io_failed".to_string(),
            AppError::PathResolution(_) => "path_resolution_failed".to_string(),
            AppError::AgentSteamIdUnknown => "agent_steam_id_unknown".to_string(),
            AppError::GamesCacheIo(_) => "games_cache_io_failed".to_string(),
            AppError::IdleProcessStartFailed { .. } => "idle_process_start_failed".to_string(),
            AppError::FavoritesCacheIo(_) => "favorites_cache_io_failed".to_string(),
            AppError::AutoIdleCacheIo(_) => "auto_idle_cache_io_failed".to_string(),
            AppError::AchievementUnlockerQueueCacheIo(_) => {
                "achievement_unlocker_queue_cache_io_failed".to_string()
            }
            AppError::CardFarmingQueueCacheIo(_) => {
                "card_farming_queue_cache_io_failed".to_string()
            }
            AppError::CardFarmingBlacklistCacheIo(_) => {
                "card_farming_blacklist_cache_io_failed".to_string()
            }
            AppError::AchievementUnlockerSettingsIo(_) => {
                "achievement_unlocker_settings_io_failed".to_string()
            }
            AppError::PresenceSettingsIo(_) => "presence_settings_io_failed".to_string(),
            AppError::AchievementOrderIo(_) => "achievement_order_io_failed".to_string(),
            AppError::PlayerProfilePrivate => "player_profile_private".to_string(),
            AppError::PlayerNoTimestamps => "player_no_timestamps".to_string(),
            AppError::PlayerProfileNotFound(_) => "player_profile_not_found".to_string(),
            AppError::FreeGamesScrapeFailed(_) => "free_games_scrape_failed".to_string(),
            AppError::StoreLoginFailed(_) => "store_login_failed".to_string(),
            AppError::StoreClaimFailed(_) => "store_claim_failed".to_string(),
            AppError::StoreLogoutFailed(_) => "store_logout_failed".to_string(),
            AppError::FreeGamesSettingsIo(_) => "free_games_settings_io_failed".to_string(),
            AppError::SettingsIo(_) => "settings_io_failed".to_string(),
            AppError::DeviceFingerprint(_) => "device_fingerprint_failed".to_string(),
            AppError::SteamCommunitySessionFailed(_) => {
                "steam_community_session_failed".to_string()
            }
            AppError::SteamCommunitySessionExpired(_) => {
                "steam_community_session_expired".to_string()
            }
            AppError::CardFarmingScrapeFailed(_) => "card_farming_scrape_failed".to_string(),
            AppError::SteamUtility(code) => code.clone(),
            AppError::InventoryFetchFailed(_) => "inventory_fetch_failed".to_string(),
            AppError::InventoryCacheIo(_) => "inventory_cache_io_failed".to_string(),
            AppError::MarketPriceFetchFailed(_) => "market_price_fetch_failed".to_string(),
            AppError::MarketPriceRateLimited => "market_price_rate_limited".to_string(),
            AppError::InventoryItemNotFound(_) => "inventory_item_not_found".to_string(),
            AppError::MarketListingsFetchFailed(_) => "market_listings_fetch_failed".to_string(),
            AppError::InventorySettingsIo(_) => "inventory_settings_io_failed".to_string(),
            AppError::CardFarmingSettingsIo(_) => "card_farming_settings_io_failed".to_string(),
            AppError::IdlingSettingsIo(_) => "idling_settings_io_failed".to_string(),
            AppError::MaxPlaytimeSettingsIo(_) => "max_playtime_settings_io_failed".to_string(),
            AppError::MaxPlaytimeCapReached => "max_playtime_cap_reached".to_string(),
            AppError::LogIo(_) => "log_io_failed".to_string(),
            AppError::CacheClearIo(_) => "cache_clear_failed".to_string(),
            AppError::SteamCredentialsStoreIo(_) => "steam_credentials_store_io_failed".to_string(),
            AppError::ZoomFactorFailed(_) => "zoom_factor_failed".to_string(),
            AppError::CustomBackgroundInvalid(_) => "custom_background_invalid".to_string(),
            AppError::CustomBackgroundIo(_) => "custom_background_io_failed".to_string(),
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.code())
    }
}

pub type AppResult<T> = Result<T, AppError>;
