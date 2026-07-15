use std::collections::HashSet;

use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::local_steam::commands::require_steam_running;
use crate::steam_agent::AgentManager;

use super::{
    blacklist, queue, scraper, session, settings, CardFarmingBlacklistEntry, CardFarmingManager,
    CardFarmingQueueEntry, DropsRemaining, FarmingState, GameWithDrops, SteamCookies,
};
use settings::CardFarmingSettings;

/// Card drops remaining for one game, for `account`'s Steam Community session. `manual_cookies`
/// lets the caller skip automatic hidden-webview session acquisition entirely - the casual/
/// free-tier fallback (see `mod.rs`'s doc comment); omit it to use the automatic path, which is
/// expected to be gated behind `hasGamerAccess` once a frontend exists for this feature.
#[tauri::command]
pub async fn get_drops_remaining(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    manual_cookies: Option<SteamCookies>,
) -> AppResult<DropsRemaining> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(
        &app_handle,
        &agent_manager,
        &account,
        &steam_id,
        manual_cookies,
    )
    .await?;
    scraper::get_drops_remaining(&steam_id, app_id, &cookies).await
}

/// Every owned game with at least one card drop remaining, for `account`'s Steam Community
/// session - excludes any game the account has blacklisted (see [`blacklist`]'s doc comment), so a
/// blacklisted game never reappears in the browse list to begin with. See [`get_drops_remaining`]'s
/// doc comment for `manual_cookies`.
#[tauri::command]
pub async fn get_games_with_drops(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    manual_cookies: Option<SteamCookies>,
) -> AppResult<Vec<GameWithDrops>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(
        &app_handle,
        &agent_manager,
        &account,
        &steam_id,
        manual_cookies,
    )
    .await?;
    let blacklisted: HashSet<u32> = blacklist::read(&app_handle, &steam_id)
        .await?
        .into_iter()
        .map(|entry| entry.app_id)
        .collect();
    let games: Vec<GameWithDrops> = scraper::get_games_with_drops(&steam_id, &cookies)
        .await?
        .into_iter()
        .filter(|g| !blacklisted.contains(&g.app_id))
        .collect();
    tracing::info!(
        steam_id,
        count = games.len(),
        "fetched games with card drops remaining"
    );
    Ok(games)
}

/// Starts a farming cycle for `account`: idles this account's currently-*queued* games with card
/// drops remaining (see [`queue`]) concurrently, up to 32 at once, polling each until its drops
/// hit zero and backfilling more from the queue as slots free up, until none are left. Idempotent -
/// calling this while a cycle is already running for the account just returns its current state
/// rather than starting a second one. `manual_cookies` behaves exactly as in
/// [`get_drops_remaining`]/[`get_games_with_drops`] - resolved once here and reused for the whole
/// cycle's repeated polling, not re-resolved per poll. See `manager.rs`'s module doc comment for
/// how this matches `main`'s concurrency without its toggle-timing design. Blacklisted app IDs are
/// filtered out of the queued set here too - defense in depth alongside the frontend removing a
/// newly-blacklisted game from the persisted queue directly (see [`blacklist`]'s doc comment).
#[tauri::command]
pub async fn start_farming(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    card_farming_manager: State<'_, CardFarmingManager>,
    account: GamesAccount,
    manual_cookies: Option<SteamCookies>,
) -> AppResult<FarmingState> {
    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }

    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(
        &app_handle,
        &agent_manager,
        &account,
        &steam_id,
        manual_cookies,
    )
    .await?;
    let blacklisted: HashSet<u32> = blacklist::read(&app_handle, &steam_id)
        .await?
        .into_iter()
        .map(|entry| entry.app_id)
        .collect();
    let queued_app_ids: HashSet<u32> = queue::read(&app_handle, &steam_id)
        .await?
        .into_iter()
        .map(|entry| entry.app_id)
        .filter(|app_id| !blacklisted.contains(app_id))
        .collect();
    card_farming_manager
        .start(&app_handle, steam_id, account, cookies, queued_app_ids)
        .await
}

/// Stops `account`'s farming cycle if one is running - idempotent (a no-op if nothing is
/// tracked).
#[tauri::command]
pub async fn stop_farming(
    agent_manager: State<'_, AgentManager>,
    card_farming_manager: State<'_, CardFarmingManager>,
    account: GamesAccount,
) -> AppResult<()> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    card_farming_manager.stop(&steam_id).await
}

/// The account's current farming-cycle state - a default/empty, not-farming `FarmingState` if
/// nothing is running.
#[tauri::command]
pub async fn get_farming_state(
    agent_manager: State<'_, AgentManager>,
    card_farming_manager: State<'_, CardFarmingManager>,
    account: GamesAccount,
) -> AppResult<FarmingState> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    Ok(card_farming_manager.state(&steam_id).await)
}

#[tauri::command]
pub async fn get_card_farming_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<CardFarmingSettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get(&app_handle, &steam_id).await
}

/// Whole-struct replace - see `settings::set`'s doc comment for why this isn't a dot-path merge.
#[tauri::command]
pub async fn set_card_farming_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    settings: CardFarmingSettings,
) -> AppResult<CardFarmingSettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::settings::set(&app_handle, &steam_id, settings).await
}

/// The account-wide "max card farming time" override, in minutes - `0` means unlimited. Wins over
/// any per-game override when set (see `settings::FarmingCaps`'s doc comment / `manager::is_capped`).
#[tauri::command]
pub async fn get_card_farming_global_max_farming_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<u32> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_global_max_card_farming_time(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn set_card_farming_global_max_farming_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    minutes: u32,
) -> AppResult<u32> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_global_max_card_farming_time(&app_handle, &steam_id, minutes).await
}

/// Per-game "max card drops" override - `None` clears it. No global override exists for this one
/// (matches `main`, which has no `globalMaxCardDrops`).
#[tauri::command]
pub async fn get_card_farming_max_card_drops(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_max_card_drops(&app_handle, &steam_id, app_id).await
}

#[tauri::command]
pub async fn set_card_farming_max_card_drops(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    max_card_drops: Option<u32>,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_max_card_drops(&app_handle, &steam_id, app_id, max_card_drops).await
}

/// Per-game "max card farming time" override, in minutes - `None` clears it. Only takes effect
/// when no account-wide override is set (see `settings::FarmingCaps`'s doc comment).
#[tauri::command]
pub async fn get_card_farming_max_card_farming_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_max_card_farming_time(&app_handle, &steam_id, app_id).await
}

#[tauri::command]
pub async fn set_card_farming_max_card_farming_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    max_card_farming_time: Option<u32>,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_max_card_farming_time(&app_handle, &steam_id, app_id, max_card_farming_time).await
}

/// App IDs with an active `maxCardDrops`/`maxCardFarmingTime` override (either counts) - backs the
/// Game Settings tab's "customized" list indicator.
#[tauri::command]
pub async fn get_card_farming_customized_app_ids(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::customized_app_ids(&app_handle, &steam_id).await
}

/// This account's curated card-farming queue - what [`start_farming`] actually farms. Mirrors
/// `achievement_unlocker::commands::get_achievement_unlocker_queue` exactly.
#[tauri::command]
pub async fn get_card_farming_queue(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    queue::read(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn add_to_card_farming_queue(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    game: CardFarmingQueueEntry,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    queue::add(&app_handle, &steam_id, game).await
}

#[tauri::command]
pub async fn remove_from_card_farming_queue(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    queue::remove(&app_handle, &steam_id, app_id).await
}

/// Bulk-replaces the queue order - used after drag-reorder on the queue tab. Mirrors
/// `achievement_unlocker::commands::set_achievement_unlocker_queue_order`.
#[tauri::command]
pub async fn set_card_farming_queue_order(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    queue: Vec<CardFarmingQueueEntry>,
) -> AppResult<Vec<CardFarmingQueueEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::queue::set_order(&app_handle, &steam_id, queue).await
}

/// This account's card-farming blacklist - games [`start_farming`]/[`get_games_with_drops`] will
/// never farm or list. See [`blacklist`]'s doc comment.
#[tauri::command]
pub async fn get_card_farming_blacklist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    blacklist::read(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn add_to_card_farming_blacklist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    game: CardFarmingBlacklistEntry,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    blacklist::add(&app_handle, &steam_id, game).await
}

#[tauri::command]
pub async fn remove_from_card_farming_blacklist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    blacklist::remove(&app_handle, &steam_id, app_id).await
}

/// Empties the whole blacklist - used by the Blacklisted tab's "Clear" action. Mirrors
/// `set_card_farming_queue_order`'s bulk-replace shape, minus the ordering (a blacklist has none).
#[tauri::command]
pub async fn clear_card_farming_blacklist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    blacklist::clear(&app_handle, &steam_id).await
}
