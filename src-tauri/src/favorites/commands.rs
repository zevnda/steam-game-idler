use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::steam_agent::AgentManager;

use super::{cache, FavoriteEntry};

#[tauri::command]
pub async fn get_favorites(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<FavoriteEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::read(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn add_favorite(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    game: FavoriteEntry,
) -> AppResult<Vec<FavoriteEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let result = cache::add(&app_handle, &steam_id, game).await;
    if let Err(e) = &result {
        tracing::warn!(steam_id, error = %e, "favorites: failed to add favorite");
    }
    result
}

#[tauri::command]
pub async fn remove_favorite(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Vec<FavoriteEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let result = cache::remove(&app_handle, &steam_id, app_id).await;
    if let Err(e) = &result {
        tracing::warn!(steam_id, error = %e, "favorites: failed to remove favorite");
    }
    result
}

/// Bulk-replaces the favorites order - used after drag-reorder in the "Favorites" tab. Mirrors the
/// reference app's `update_custom_list`, minus its stringly-typed `list` param (this module only
/// ever manages one list).
#[tauri::command]
pub async fn set_favorites_order(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    favorites: Vec<FavoriteEntry>,
) -> AppResult<Vec<FavoriteEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let result = cache::set_order(&app_handle, &steam_id, favorites).await;
    if let Err(e) = &result {
        tracing::warn!(steam_id, error = %e, "favorites: failed to reorder favorites");
    }
    result
}
