use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::steam_agent::AgentManager;

use super::settings;

/// The account-wide "max playtime" override - `0` means unlimited. Applies across manual idling,
/// auto-idle, achievement-unlocker, and card farming alike - see `super`'s module doc comment.
#[tauri::command]
pub async fn get_global_max_playtime(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<u32> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_global_max_playtime(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn set_global_max_playtime(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    minutes: u32,
) -> AppResult<u32> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_global_max_playtime(&app_handle, &steam_id, minutes).await
}

/// Per-game "max playtime" override - `None` clears it. Takes precedence over the account-wide
/// override when set (see `settings::effective_max_playtime`'s precedence).
#[tauri::command]
pub async fn get_max_playtime(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_max_playtime(&app_handle, &steam_id, app_id).await
}

#[tauri::command]
pub async fn set_max_playtime(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    max_playtime: Option<u32>,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_max_playtime(&app_handle, &steam_id, app_id, max_playtime).await
}

/// App IDs with an active `maxPlaytime` override - backs the Game Settings tab's "customized" list
/// indicator.
#[tauri::command]
pub async fn get_max_playtime_customized_app_ids(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::customized_app_ids(&app_handle, &steam_id).await
}
