use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::local_steam;
use crate::steam_agent::AgentManager;

use super::settings::FreeGamesSettings;
use super::{discovery, FreeGameClaimOutcome, FreeGameEntry};

/// No account param - this is public, anonymous data with no per-account meaning (see
/// `discovery.rs`). Uncached in Rust, matching `main`: it's a live external list, unlike
/// owned-games/favorites, and doesn't belong in the same per-SteamID64 cache convention. The
/// frontend does its own polling/filtering against already-loaded owned-games state.
#[tauri::command]
pub async fn get_free_games() -> AppResult<Vec<FreeGameEntry>> {
    discovery::discover().await
}

/// Claims a free game for `account`'s currently-signed-in Steam account. One command for both
/// sign-in modes, branching internally - the two modes' mechanics are genuinely different (see
/// `mod.rs`'s doc comment), not just a different backend call with the same shape.
#[tauri::command]
pub async fn claim_free_game(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    api_key: Option<String>,
) -> AppResult<FreeGameClaimOutcome> {
    // Cloned before the match consumes `account` by value - kept only so the log lines below can
    // identify which account a claim outcome belongs to (there was previously no account
    // identifier in this log line at all, which made a background account's claim indistinguishable
    // from the currently-active one when diagnosing an auto-redeem issue).
    let account_for_log = account.clone();
    let outcome = match account {
        GamesAccount::Agent { username } => {
            agent_manager
                .request_free_license(&app_handle, &username, app_id, api_key)
                .await
        }
        GamesAccount::Local { steam_id } => {
            local_steam::free_game_claim::claim(&app_handle, &steam_id, app_id, api_key).await
        }
    };
    // Agent mode's `request_free_license` has no logging of its own (SteamKit2's grant is a single
    // IPC round trip, not a multi-attempt poll worth narrating step by step the way CLI mode's
    // `claim` is) - logging the resolved outcome here covers both modes uniformly in one place.
    match &outcome {
        Ok(result) => {
            tracing::info!(account = ?account_for_log, app_id, outcome = ?result, "free games: claim resolved")
        }
        Err(e) => {
            tracing::warn!(account = ?account_for_log, app_id, error = %e.code(), "free games: claim errored")
        }
    }
    outcome
}

#[tauri::command]
pub async fn get_free_games_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<FreeGamesSettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::settings::get(&app_handle, &steam_id).await
}

/// Whole-struct replace - see `settings::set`'s doc comment for why this isn't a dot-path merge.
#[tauri::command]
pub async fn set_free_games_settings(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    settings: FreeGamesSettings,
) -> AppResult<FreeGamesSettings> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    super::settings::set(&app_handle, &steam_id, settings).await
}

/// Establishes (or refreshes) this account's persisted Steam store session - a no-op for agent
/// mode, which needs no cookies at all to claim a free game (`AgentManager::request_free_license`,
/// see `mod.rs`'s doc comment). For a CLI-mode account, this is what the frontend calls the moment
/// the user turns free-games auto-redeem *on*, so any real, interactive sign-in happens right then
/// (visible, expected) rather than mid-background-poll later (invisible, confusing) - every claim
/// after the first reuses the same persisted `local_steam::free_game_claim` webview profile
/// silently. Also used for the settings tab's "Reauthenticate" action.
#[tauri::command]
pub async fn ensure_free_games_store_session(
    app_handle: AppHandle,
    account: GamesAccount,
) -> AppResult<()> {
    match account {
        GamesAccount::Agent { .. } => Ok(()),
        GamesAccount::Local { steam_id } => {
            local_steam::free_game_claim::ensure_store_session(&app_handle, &steam_id).await
        }
    }
}

/// Signs this account's persisted Steam store session out - a no-op for agent mode (see
/// `ensure_free_games_store_session`'s doc comment). Used by the settings tab's "Sign out" action.
#[tauri::command]
pub async fn clear_free_games_store_session(
    app_handle: AppHandle,
    account: GamesAccount,
) -> AppResult<()> {
    match account {
        GamesAccount::Agent { .. } => Ok(()),
        GamesAccount::Local { steam_id } => {
            local_steam::free_game_claim::clear_session(&app_handle, &steam_id).await
        }
    }
}
