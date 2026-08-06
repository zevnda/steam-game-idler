use std::collections::HashSet;

use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::local_steam::commands::require_steam_running;
use crate::steam_agent::AgentManager;

use super::{
    blacklist, scraper, session, settings, whitelist, CardFarmingBlacklistEntry,
    CardFarmingManager, CardFarmingWhitelistEntry, FarmingState, GameWithDrops, SteamCookies,
};
use settings::CardFarmingSettings;

/// Every owned game with at least one card drop remaining, for `account`'s Steam Community
/// session - excludes any game the account has blacklisted (see [`blacklist`]'s doc comment), so a
/// blacklisted game never reappears in the browse list to begin with. `manual_cookies` lets the
/// caller skip automatic hidden-webview session acquisition entirely - the casual/free-tier
/// fallback (see `mod.rs`'s doc comment); omit it to use the automatic path, gated behind
/// `hasGamerAccess` on the frontend.
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

/// Starts a farming cycle for `account` - automatic from here on, see `mod.rs`'s module doc
/// comment: every outer-loop iteration resolves its own eligible pool (scoped to the whitelist when
/// non-empty) fresh, so there's no queue/whitelist-building step for this command to do itself.
/// Idempotent - calling this while a cycle is already running for the account just returns its
/// current state rather than starting a second one. `manual_cookies` behaves exactly as in
/// [`get_games_with_drops`] - resolved once here and reused for the whole cycle's repeated polling,
/// not re-resolved per iteration.
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
    card_farming_manager
        .start(&app_handle, steam_id, account, cookies)
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
    settings::set(&app_handle, &steam_id, settings).await
}

/// This account's card-farming whitelist - when non-empty, [`start_farming`] only ever farms these
/// games. See [`whitelist`]'s doc comment.
#[tauri::command]
pub async fn get_card_farming_whitelist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    whitelist::read(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn add_to_card_farming_whitelist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    game: CardFarmingWhitelistEntry,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    whitelist::add(&app_handle, &steam_id, game).await
}

#[tauri::command]
pub async fn remove_from_card_farming_whitelist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    whitelist::remove(&app_handle, &steam_id, app_id).await
}

/// Empties the whole whitelist - used by the Whitelist tab's "Clear" action.
#[tauri::command]
pub async fn clear_card_farming_whitelist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<CardFarmingWhitelistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    whitelist::clear(&app_handle, &steam_id).await
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

/// Empties the whole blacklist - used by the Blacklisted tab's "Clear" action.
#[tauri::command]
pub async fn clear_card_farming_blacklist(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<CardFarmingBlacklistEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    blacklist::clear(&app_handle, &steam_id).await
}
