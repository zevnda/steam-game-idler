use tauri::{AppHandle, State};

use crate::error::AppResult;

use super::manager::{AgentManager, LoginOutcome, QrChallenge};
use super::presence_settings::{self, PresenceSettings};

/// Starts (or restarts) an agent-mode sign-in for `username`/`password`. Resolves as soon as
/// SteamUtility responds - which may be immediate success, or a guard-code/device-confirmation
/// prompt the caller must resolve via [`agent_submit_guard_code`] before the account is actually
/// logged on.
#[tauri::command]
pub async fn agent_login(
    app_handle: AppHandle,
    manager: State<'_, AgentManager>,
    username: String,
    password: String,
) -> AppResult<LoginOutcome> {
    manager.login(&app_handle, username, password).await
}

/// Starts a QR sign-in attempt and returns its challenge URL to render as a QR code, plus an
/// opaque `sessionKey` the frontend must use to filter subsequent `steam-agent-event`s for this
/// attempt (no username is known yet - see [`AgentManager::begin_qr_login`]). The daemon rotates
/// the challenge URL periodically until scanned; each rotation arrives as a `qr_challenge_url`
/// event on the same `sessionKey`. Resolves into the normal `refresh_token`/`login_failed` events
/// once the mobile app confirms the scan, exactly like [`agent_login`]'s guard-code follow-up.
#[tauri::command]
pub async fn agent_begin_qr_login(
    app_handle: AppHandle,
    manager: State<'_, AgentManager>,
) -> AppResult<QrChallenge> {
    manager.begin_qr_login(&app_handle).await
}

/// Abandons a pending QR attempt identified by `sessionKey` (from a prior [`agent_begin_qr_login`]
/// call) - user hit back/cancel, or the sign-in screen unmounted before a scan completed.
#[tauri::command]
pub async fn agent_cancel_qr_login(
    manager: State<'_, AgentManager>,
    session_key: String,
) -> AppResult<()> {
    manager.cancel_qr_login(&session_key).await;
    Ok(())
}

/// Answers a pending guard-code prompt from a prior [`agent_login`] call for `username`.
///
#[tauri::command]
pub async fn agent_submit_guard_code(
    manager: State<'_, AgentManager>,
    username: String,
    code: String,
) -> AppResult<()> {
    manager.submit_guard_code(&username, code).await
}

/// Resumes a session for `username` using its previously saved refresh token, skipping the
/// interactive credential/guard-code flow. Returns whether the logon succeeded. Fails with
/// `agent_no_saved_credentials` if no token was ever saved for this account.
#[tauri::command]
pub async fn agent_login_with_token(
    app_handle: AppHandle,
    manager: State<'_, AgentManager>,
    username: String,
) -> AppResult<bool> {
    manager.login_with_token(&app_handle, username).await
}

/// Ends the live agent session for `username` and stops its `SteamUtility.exe` process. Does not
/// forget the account's saved refresh token.
#[tauri::command]
pub async fn agent_logout(manager: State<'_, AgentManager>, username: String) -> AppResult<()> {
    manager.logout(&username).await
}

/// Reads this account's saved presence settings (persona state + custom idle status) - agent-mode
/// only, no CLI-mode equivalent.
#[tauri::command]
pub async fn agent_get_presence_settings(
    app_handle: AppHandle,
    manager: State<'_, AgentManager>,
    username: String,
) -> AppResult<PresenceSettings> {
    let steam_id = manager.steam_id(&username).await?;
    presence_settings::get(&app_handle, &steam_id).await
}

/// Saves this account's presence settings, then applies them live wherever a connected session
/// can see the effect right away: pushes the persona state via `set_persona_state`, and - if the
/// account is currently idling anything - re-announces with the new custom status text so an edit
/// made while idling takes effect immediately rather than waiting for the next `idle_set` call.
/// Both live-apply steps are best-effort - a disconnected session (e.g. the user set this before
/// signing in, or mid-reconnect) still gets the setting saved, just not live-pushed until the next
/// natural `idle_set`/reconnect.
#[tauri::command]
pub async fn agent_set_presence_settings(
    app_handle: AppHandle,
    manager: State<'_, AgentManager>,
    username: String,
    settings: PresenceSettings,
) -> AppResult<PresenceSettings> {
    let steam_id = manager.steam_id(&username).await?;
    let saved = presence_settings::set(&app_handle, &steam_id, settings).await?;

    if let Err(e) = manager
        .set_persona_state(&username, saved.persona_state)
        .await
    {
        tracing::warn!(username, error = %e, "failed to live-apply persona state after presence settings save");
    }

    let idling = manager.idle_state(&username).await.unwrap_or_default();
    if !idling.is_empty() {
        if let Err(e) = manager
            .set_idle_games(&username, idling, saved.custom_idle_status.clone())
            .await
        {
            tracing::warn!(username, error = %e, "failed to live-reannounce custom idle status after presence settings save");
        }
    }

    Ok(saved)
}
