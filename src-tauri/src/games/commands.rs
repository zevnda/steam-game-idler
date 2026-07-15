use serde::Deserialize;
use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::local_steam;
use crate::steam_agent::AgentManager;

use super::{cache, merge, web_api, OwnedGame, OwnedGamesResult};

/// Identifies which sign-in mode's owned-games list to fetch, and the identifier that mode needs.
/// Agent mode resolves everything from the already-signed-in `username`'s live session (including
/// its SteamID64, once `status_changed` has reported one - see `steam_agent::AgentManager::steam_id`).
/// CLI mode has no persistent session of its own to resolve a SteamID64 from, so it's passed
/// directly (the frontend already has it from `local_steam::commands::get_users`).
#[derive(Debug, Clone, Deserialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "mode"
)]
pub enum GamesAccount {
    Agent { username: String },
    Local { steam_id: String },
}

/// Resolves an account's SteamID64 - agent mode looks one up from its live session (only known
/// once `status_changed` has reported one, see `AgentManager::steam_id`), local mode already has
/// one from `loginusers.vdf` and just passes it through. Shared by every per-account feature that
/// needs to key something by SteamID64 (owned-games cache, favorites cache, ...) rather than
/// re-inlining this match per caller.
pub async fn resolve_steam_id(
    account: &GamesAccount,
    agent_manager: &AgentManager,
) -> AppResult<String> {
    match account {
        GamesAccount::Agent { username } => agent_manager.steam_id(username).await,
        GamesAccount::Local { steam_id } => Ok(steam_id.clone()),
    }
}

/// Frontend-facing wrapper around [`resolve_steam_id`] - needed because unlike CLI mode (whose
/// SteamID64 the frontend already has from `local_steam::commands::get_users`), agent mode has no
/// other way to learn its signed-in account's resolved SteamID64. First real caller: the
/// subscription check, which needs a SteamID64 for its API request body regardless of sign-in mode.
#[tauri::command]
pub async fn resolve_account_steam_id(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<String> {
    resolve_steam_id(&account, &agent_manager).await
}

/// Fetches this account's owned games (app id + name + playtime) and caches the merged result
/// keyed by the account's SteamID64. One command for both sign-in modes, branching internally,
/// rather than a pair of mode-specific commands with frontend-side branching.
///
/// CLI mode's ownership check has no playtime source of its own, so it's merged with the Steam Web
/// API's `GetOwnedGames` here (which also folds in any owned games outside the local backend's
/// curated whitelist). Agent mode's ownership check (PICS-based) already comes back fully
/// enriched with playtime from the daemon's own `Player.GetOwnedGames#1` call, so it skips the Web
/// API entirely - see `RawOwnedGame`'s doc comment. That split is also why only CLI mode can ever
/// report `possibly_private`: it's the only mode whose completeness still depends on the Web API,
/// which - unlike SteamKit2's authenticated-session RPC - is subject to Steam Community
/// profile/game-details privacy settings when not using the account's own API key.
///
/// The Steam Web API key override (if any) is read from the OS credential store internally rather
/// than passed as a parameter - one less thing for every caller of this command to remember to
/// plumb through.
#[tauri::command]
pub async fn get_owned_games(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<OwnedGamesResult> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let is_agent = matches!(account, GamesAccount::Agent { .. });
    let raw_games = match account {
        GamesAccount::Agent { username } => agent_manager.get_owned_apps(&username).await?,
        GamesAccount::Local { .. } => local_steam::ownership::check_ownership().await?,
    };

    // Agent mode's `raw_games` already carries playtime from the daemon's own
    // Player.GetOwnedGames#1 enrichment (see RawOwnedGame's doc comment) - it never touches the
    // Steam Web API, so it's never subject to the private-profile detection below either.
    let (merged, possibly_private) = if is_agent {
        (merge::from_agent(raw_games), false)
    } else {
        let api_key = crate::credential_store::load_web_api_key()?;
        let fetch = web_api::fetch_owned_games(&steam_id, api_key).await?;
        (merge::merge(raw_games, fetch.games), fetch.possibly_private)
    };

    cache::write(&app_handle, &steam_id, &merged)?;

    tracing::info!(
        steam_id,
        count = merged.len(),
        possibly_private,
        "fetched owned games list"
    );
    Ok(OwnedGamesResult {
        games: merged,
        possibly_private,
    })
}

/// Reads back the last cached owned-games list for `steam_id` without hitting the network - an
/// empty list if nothing has been cached yet (not an error, same convention `get_user_summary_cache`
/// already uses).
#[tauri::command]
pub fn get_owned_games_cache(app_handle: AppHandle, steam_id: String) -> AppResult<Vec<OwnedGame>> {
    cache::read(&app_handle, &steam_id)
}

#[tauri::command]
pub fn delete_owned_games_cache(app_handle: AppHandle, steam_id: String) -> AppResult<()> {
    let result = cache::delete(&app_handle, &steam_id);
    match &result {
        Ok(()) => tracing::info!(steam_id, "deleted owned games cache"),
        Err(e) => tracing::warn!(steam_id, error = %e, "failed to delete owned games cache"),
    }
    result
}
