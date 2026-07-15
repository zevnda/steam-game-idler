use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::local_steam::commands::require_steam_running;
use crate::steam_agent::AgentManager;

use super::{
    cache, import_timings, order, settings, AchievementUnlockerEntry, AchievementUnlockerManager,
    AchievementUnlockerState,
};
use import_timings::AchievementTiming;
use order::AchievementOrder;
use settings::AchievementUnlockerSettings;

#[tauri::command]
pub async fn get_achievement_unlocker_queue(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<AchievementUnlockerEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::read(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn add_to_achievement_unlocker_queue(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    game: AchievementUnlockerEntry,
) -> AppResult<Vec<AchievementUnlockerEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::add(&app_handle, &steam_id, game).await
}

#[tauri::command]
pub async fn remove_from_achievement_unlocker_queue(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Vec<AchievementUnlockerEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::remove(&app_handle, &steam_id, app_id).await
}

/// Bulk-replaces the queue order - used after drag-reorder on the queue page. Mirrors
/// `favorites::commands::set_favorites_order`.
#[tauri::command]
pub async fn set_achievement_unlocker_queue_order(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    queue: Vec<AchievementUnlockerEntry>,
) -> AppResult<Vec<AchievementUnlockerEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::set_order(&app_handle, &steam_id, queue).await
}

#[tauri::command]
pub async fn get_achievement_unlocker_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<AchievementUnlockerSettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get(&app_handle, &steam_id).await
}

/// Whole-struct replace - see `settings::set`'s doc comment for why this isn't a dot-path merge.
#[tauri::command]
pub async fn set_achievement_unlocker_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    settings: AchievementUnlockerSettings,
) -> AppResult<AchievementUnlockerSettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::settings::set(&app_handle, &steam_id, settings).await
}

#[tauri::command]
pub async fn get_achievement_unlocker_max_unlocks(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_max_unlocks(&app_handle, &steam_id, app_id).await
}

/// `max_unlocks: None` clears the per-game override - see `settings::set_max_unlocks`.
#[tauri::command]
pub async fn set_achievement_unlocker_max_unlocks(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    max_unlocks: Option<u32>,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_max_unlocks(&app_handle, &steam_id, app_id, max_unlocks).await
}

/// App IDs with an active `maxUnlocks` override - backs the Game Settings tab's "customized" list
/// indicator.
#[tauri::command]
pub async fn get_achievement_unlocker_customized_app_ids(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::customized_app_ids(&app_handle, &steam_id).await
}

/// `None` if `app_id` has never had a custom order saved - see `order::get`.
#[tauri::command]
pub async fn get_achievement_order(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Option<AchievementOrder>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    order::get(&app_handle, &steam_id, app_id).await
}

/// Whole-replace - see `order::save`'s doc comment for why this isn't a merge.
#[tauri::command]
pub async fn save_achievement_order(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    order: AchievementOrder,
) -> AppResult<AchievementOrder> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::order::save(&app_handle, &steam_id, app_id, order).await
}

/// Fetches a target Steam profile's real achievement unlock timestamps for `app_id`, used by the
/// (gamer-tier gated, frontend-only) import-timings feature to derive realistic per-achievement
/// delays. Not account-scoped - `steam_input` names an arbitrary profile, unrelated to the signed-in
/// account, so this doesn't take a `GamesAccount`. The Steam Web API key override (if any) is read
/// from the OS credential store internally, same convention `games::commands::get_owned_games`
/// already uses.
#[tauri::command]
pub async fn import_achievement_timings(
    app_id: u32,
    steam_input: String,
) -> AppResult<Vec<AchievementTiming>> {
    let api_key = crate::credential_store::load_web_api_key()?;
    import_timings::get_player_achievement_timings(app_id, steam_input, api_key).await
}

/// Starts an unlock automation session for `account`: repeats scan-then-unlock passes over the
/// queue until it's empty, per `manager.rs`'s doc comment. Idempotent - calling this while a
/// session is already running for the account just returns its current state. `max_concurrent_games`
/// is resolved by the frontend (1, or up to `manager::MAX_CONCURRENT_GAMES` for gamer-tier accounts
/// with the `multipleGames` setting on - see `AchievementUnlockerSettings::multiple_games`'s doc
/// comment) and clamped here, not re-derived - this command doesn't re-check the tier gate itself.
#[tauri::command]
pub async fn start_achievement_unlocker(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    unlocker_manager: State<'_, AchievementUnlockerManager>,
    account: GamesAccount,
    max_concurrent_games: u32,
) -> AppResult<AchievementUnlockerState> {
    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }

    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    unlocker_manager
        .start(&app_handle, steam_id, account, max_concurrent_games)
        .await
}

/// Live-corrects an already-running session's worker count - called by the frontend's
/// `useAchievementUnlockerConcurrencyGuard` whenever the subscription tier changes, since
/// `start_achievement_unlocker`'s `max_concurrent_games` is otherwise only ever resolved once at
/// session start (see `manager.rs`'s doc comment for why that's not enough on its own). A no-op if
/// no session is currently running for `account`.
#[tauri::command]
pub async fn update_achievement_unlocker_concurrency(
    agent_manager: State<'_, AgentManager>,
    unlocker_manager: State<'_, AchievementUnlockerManager>,
    account: GamesAccount,
    max_concurrent_games: u32,
) -> AppResult<()> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    unlocker_manager
        .set_max_concurrent_games(&steam_id, max_concurrent_games)
        .await;
    Ok(())
}

/// Stops `account`'s unlock automation session if one is running - idempotent (a no-op if nothing
/// is tracked).
#[tauri::command]
pub async fn stop_achievement_unlocker(
    agent_manager: State<'_, AgentManager>,
    unlocker_manager: State<'_, AchievementUnlockerManager>,
    account: GamesAccount,
) -> AppResult<()> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    unlocker_manager.stop(&steam_id).await
}

/// The account's current unlock automation state - a default/not-running state if nothing is
/// running.
#[tauri::command]
pub async fn get_achievement_unlocker_state(
    agent_manager: State<'_, AgentManager>,
    unlocker_manager: State<'_, AchievementUnlockerManager>,
    account: GamesAccount,
) -> AppResult<AchievementUnlockerState> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    Ok(unlocker_manager.state(&steam_id).await)
}
