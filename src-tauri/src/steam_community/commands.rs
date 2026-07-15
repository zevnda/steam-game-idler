use tauri::{AppHandle, State};

use crate::error::{AppError, AppResult};
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::steam_agent::AgentManager;

use super::{credentials, session, session::SessionStatus, SteamCookies};

/// `Ok(None)` if `account` has never saved manual credentials - see `credentials.rs`'s doc
/// comment for why this is CLI-mode only and never touched by `reset_settings`.
#[tauri::command]
pub async fn get_steam_credentials(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Option<SteamCookies>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    credentials::get(&steam_id)
}

/// Raw, unvalidated store write - only safe to call once `cookies` are already known-good (e.g.
/// `SteamCookiesConnectPanel`'s manual tab, which only calls this after its own feature-specific
/// `onConnect` - `get_games_with_drops`/`get_inventory`, both routed through `session::resolve` -
/// has already proven them). The Settings modal's Steam Credentials tab has no such prior proof
/// step of its own, so it calls [`validate_and_save_steam_credentials`] instead - never this
/// directly.
#[tauri::command]
pub async fn set_steam_credentials(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    cookies: SteamCookies,
) -> AppResult<()> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let result = credentials::set(&steam_id, &cookies);
    if result.is_ok() {
        tracing::info!(steam_id, "steam community: saved pre-validated credentials");
    }
    result
}

/// The Settings modal's manual-entry tab counterpart to [`set_steam_credentials`] - validates
/// `cookies` against Steam Community first ([`session::validate`]) and only persists them if
/// they actually authenticate, so a mistyped or already-stale paste is never written to the
/// credential store. Deliberately does NOT clear
/// any existing saved credentials on failure, unlike `session::ensure_valid`'s same-looking
/// `LoggedOut` branch - that one exists to self-heal a cookie set already in active use, this one
/// is validating a *candidate* before it's ever saved, so a failed replacement attempt must leave
/// whatever was already saved untouched rather than wiping out a working credential.
#[tauri::command]
pub async fn validate_and_save_steam_credentials(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    cookies: SteamCookies,
) -> AppResult<SteamCookies> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    match session::validate(&steam_id, &cookies).await? {
        SessionStatus::Valid { user } => {
            credentials::set(&steam_id, &cookies)?;
            tracing::info!(
                steam_id,
                user = %user,
                "steam community: saved manually-entered credentials from Settings"
            );
            Ok(cookies)
        }
        SessionStatus::LoggedOut => Err(AppError::SteamCommunitySessionExpired(steam_id)),
        SessionStatus::Inconclusive => Err(AppError::SteamCommunitySessionFailed(
            "could not confirm Steam Community session validity".to_string(),
        )),
    }
}

#[tauri::command]
pub async fn clear_steam_credentials(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<()> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let result = credentials::clear(&steam_id);
    if result.is_ok() {
        tracing::info!(steam_id, "steam community: cleared saved credentials");
    }
    result
}

/// The Settings modal's "Automatic" tab counterpart to `CardFarmingStartPanel`/
/// `InventoryConnectPanel`'s own automatic option - runs the exact same gamer-tier acquisition flow
/// (`session::resolve` with no manual override, so it acquires via webview for local mode or
/// derives from the live daemon session for agent mode) but also persists the result via
/// `credentials::set`, so a Settings-initiated automatic sign-in is remembered the same way a
/// manually-pasted set already is.
#[tauri::command]
pub async fn acquire_and_save_steam_credentials(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<SteamCookies> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let cookies = session::resolve(&app_handle, &agent_manager, &account, &steam_id, None).await?;
    credentials::set(&steam_id, &cookies)?;
    tracing::info!(
        steam_id,
        "steam community: saved automatically-acquired credentials from Settings"
    );
    Ok(cookies)
}
