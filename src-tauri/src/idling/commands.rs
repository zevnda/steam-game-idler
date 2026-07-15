//! One command surface for idling, regardless of sign-in mode - mirrors
//! `games::commands::get_owned_games`'s shape exactly (one `#[tauri::command]`, branching
//! internally on `GamesAccount`, rather than a pair of mode-specific commands with frontend-side
//! branching).
//!
//! Frontend-facing idling mutations (`toggle_manual_idle`/`stop_all_idling`) all go through
//! `super::claims::IdleClaimsRegistry` rather than announcing directly, so a manual action can
//! never stomp what auto-idle/achievement-unlocker/card-farming currently have claimed, and vice
//! versa - see `claims.rs`'s module doc comment for the full reasoning.

use std::collections::HashMap;

use tauri::{AppHandle, State};

use crate::error::{AppError, AppResult};
use crate::games::{
    self,
    commands::{resolve_steam_id, GamesAccount},
};
use crate::local_steam::commands::require_steam_running;
use crate::max_playtime;
use crate::steam_agent::AgentManager;

use super::auto_stop::IdleAutoStopRegistry;
use super::claims::{IdleClaimsRegistry, OWNER_AUTO_IDLE, OWNER_MANUAL};
use super::{cap_app_ids, settings, IdleSetResult, IdleTarget, IdlingManager};

/// The actual per-backend announce, with no concept of "owner" - takes the literal full set to
/// idle and nothing else. **Not registered as a Tauri command and must never be called directly
/// except by `idling::claims`** - calling this straight from a feature module (or re-exposing it
/// to the frontend) bypasses claim tracking entirely and can resurrect a game another owner just
/// stopped, or silently drop a game another owner still wants idling. Agent mode's daemon-side
/// `idle_set` has no per-game failure concept (a bad app id doesn't fail the whole announcement),
/// so its branch always returns an empty `failures` list; CLI mode's branch can report individual
/// games that failed to spawn - see `IdlingManager::set_games`.
pub(super) async fn apply_idle_targets(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    account: GamesAccount,
    targets: Vec<IdleTarget>,
) -> AppResult<IdleSetResult> {
    match account {
        GamesAccount::Agent { username } => {
            let app_ids = cap_app_ids(targets.iter().map(|t| t.app_id));
            let custom_status =
                presence_custom_status(&app_handle, &agent_manager, &username).await;
            let app_ids = agent_manager
                .set_idle_games(&username, app_ids, custom_status)
                .await?;
            Ok(IdleSetResult {
                app_ids,
                failures: Vec::new(),
            })
        }
        GamesAccount::Local { .. } => idling_manager.set_games(&app_handle, targets).await,
    }
}

/// Best-effort lookup of the account's saved custom idle-status text (see
/// `steam_agent::presence_settings`). A lookup failure - `steam_id` not resolved yet, or a genuine
/// settings IO error - degrades to "no custom text" rather than failing the whole idle announce:
/// this is a cosmetic presence preference, not something idling itself depends on.
async fn presence_custom_status(
    app_handle: &AppHandle,
    agent_manager: &AgentManager,
    username: &str,
) -> Option<String> {
    let steam_id = agent_manager.steam_id(username).await.ok()?;
    match crate::steam_agent::presence_settings::get(app_handle, &steam_id).await {
        Ok(settings) => settings.custom_idle_status,
        Err(e) => {
            tracing::warn!(
                steam_id,
                error = %e,
                "failed to read presence settings for idle announce, continuing with no custom status"
            );
            None
        }
    }
}

/// The account's currently-idling app ids. Agent mode reads the daemon's last-reported
/// `idle_state`; CLI mode reads its own tracked process set directly (kept fresh by
/// `IdlingManager`'s background poller).
#[tauri::command]
pub async fn get_idle_state(
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    account: GamesAccount,
) -> AppResult<Vec<u32>> {
    match account {
        GamesAccount::Agent { username } => agent_manager.idle_state(&username).await,
        GamesAccount::Local { .. } => Ok(idling_manager.get_state().await),
    }
}

/// The Games/Idling pages' per-card start/stop toggle. Whether this is a "start" or "stop" is
/// decided by whether *any* owner currently claims `app_id` - not just the `"manual"` owner -
/// otherwise clicking a card that's idling because achievement-unlocker/card-farming/auto-idle
/// claimed it would silently no-op (re-adding it under `"manual"`, which the union already
/// contains it in) instead of actually stopping it. A "stop" therefore releases `app_id` from
/// every owner via [`IdleClaimsRegistry::release_app_id`]; a "start" adds it to the `"manual"`
/// owner's claim and re-announces the union.
#[tauri::command]
pub async fn toggle_manual_idle(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    claims: State<'_, IdleClaimsRegistry>,
    auto_stop: State<'_, IdleAutoStopRegistry>,
    account: GamesAccount,
    app_id: u32,
    name: String,
) -> AppResult<IdleSetResult> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;

    if claims.is_claimed(&agent_manager, &account, app_id).await? {
        // Bump both owners' generations first so a timer scheduled by either an earlier manual
        // start or an auto-idle start can never fire after this explicit stop already happened -
        // belt-and-suspenders with the generation check `auto_stop`'s own spawned task does when
        // it wakes. This click stops the game regardless of who claimed it (see the doc comment
        // above), so `release_app_id` below clears every owner - both timers need invalidating.
        auto_stop.bump(&steam_id, app_id, OWNER_MANUAL).await;
        auto_stop.bump(&steam_id, app_id, OWNER_AUTO_IDLE).await;
        return claims
            .release_app_id(&app_handle, agent_manager, idling_manager, account, app_id)
            .await;
    }

    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }

    // Max-playtime cap applies to a manual start too (unlike max-idle-time, which only ever times
    // an already-running session out) - block the start outright rather than letting it begin and
    // immediately get force-stopped by `max_playtime::enforcement`'s poll loop a tick later.
    let cached_playtime =
        games::commands::get_owned_games_cache(app_handle.clone(), steam_id.clone())
            .unwrap_or_default()
            .into_iter()
            .find(|g| g.app_id == app_id)
            .map(|g| g.playtime_forever_minutes)
            .unwrap_or(0);
    if max_playtime::settings::is_over_cap(&app_handle, &steam_id, app_id, cached_playtime).await? {
        return Err(AppError::MaxPlaytimeCapReached);
    }

    let mut owner_claim = claims
        .owner_claim(&agent_manager, &account, OWNER_MANUAL)
        .await?;
    owner_claim.insert(app_id, name);
    let targets = owner_claim
        .into_iter()
        .map(|(app_id, name)| IdleTarget { app_id, name })
        .collect();
    let result = claims
        .replace_owner_claim(
            &app_handle,
            agent_manager,
            idling_manager,
            account.clone(),
            OWNER_MANUAL,
            targets,
        )
        .await?;

    // Only schedule an auto-stop timer once the start actually succeeded - a failed spawn (e.g.
    // Steam not running) shouldn't leave a timer counting down against nothing.
    auto_stop
        .schedule_if_capped(&app_handle, &steam_id, app_id, OWNER_MANUAL, account)
        .await?;

    Ok(result)
}

/// The account-wide "max idle time" override - `0` means unlimited. Applies to manual idling and
/// auto-idle only, never achievement-unlocker/card-farming (see `super::auto_stop`'s doc comment
/// for the exact scoping).
#[tauri::command]
pub async fn get_idling_global_max_idle_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<u32> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_global_max_idle_time(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn set_idling_global_max_idle_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    minutes: u32,
) -> AppResult<u32> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_global_max_idle_time(&app_handle, &steam_id, minutes).await
}

/// Per-game "max idle time" override - `None` clears it. Takes precedence over the account-wide
/// global override whenever it's set (see `settings::effective_max_idle_time`'s precedence).
#[tauri::command]
pub async fn get_idling_max_idle_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::get_max_idle_time(&app_handle, &steam_id, app_id).await
}

#[tauri::command]
pub async fn set_idling_max_idle_time(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    max_idle_time: Option<u32>,
) -> AppResult<Option<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::set_max_idle_time(&app_handle, &steam_id, app_id, max_idle_time).await
}

/// App IDs with an active `maxIdleTime` override - backs the Game Settings tab's "customized" list
/// indicator.
#[tauri::command]
pub async fn get_idling_customized_app_ids(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<u32>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    settings::customized_app_ids(&app_handle, &steam_id).await
}

/// Stops everything, from every owner - the Idling page's "Stop All" button.
#[tauri::command]
pub async fn stop_all_idling(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    claims: State<'_, IdleClaimsRegistry>,
    account: GamesAccount,
) -> AppResult<IdleSetResult> {
    claims
        .clear_all(&app_handle, agent_manager, idling_manager, account)
        .await
}

/// Every owner's current claimed app ids, keyed by owner - lets the Idling page group its games by
/// originating feature (manual/auto-idle/achievement-unlocker/card-farming).
#[tauri::command]
pub async fn get_idle_claims(
    agent_manager: State<'_, AgentManager>,
    claims: State<'_, IdleClaimsRegistry>,
    account: GamesAccount,
) -> AppResult<HashMap<String, Vec<u32>>> {
    claims.claims_by_owner(&agent_manager, &account).await
}

/// Stops one owner's section on the Idling page - only meaningful for owners with no automation
/// loop of their own (`"manual"`, `"auto_idle"`; see `claims::IdleClaimsRegistry::clear_owner`'s
/// doc comment). Card-farming/achievement-unlocker's per-section stop instead calls their own
/// `stop_farming`/`stop_achievement_unlocker` commands directly from the frontend.
#[tauri::command]
pub async fn stop_owner_idling(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    claims: State<'_, IdleClaimsRegistry>,
    account: GamesAccount,
    owner: String,
) -> AppResult<IdleSetResult> {
    claims
        .clear_owner(&app_handle, agent_manager, idling_manager, account, &owner)
        .await
}
