use std::collections::HashMap;

use tauri::{AppHandle, State};

use crate::error::AppResult;
use crate::games::{
    self,
    commands::{resolve_steam_id, GamesAccount},
};
use crate::idling::auto_stop::IdleAutoStopRegistry;
use crate::idling::claims::{IdleClaimsRegistry, OWNER_AUTO_IDLE};
use crate::idling::{IdleSetResult, IdleTarget, IdlingManager};
use crate::local_steam::commands::require_steam_running;
use crate::max_playtime;
use crate::steam_agent::AgentManager;

use super::{cache, AutoIdleEntry};

#[tauri::command]
pub async fn get_auto_idle_list(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
) -> AppResult<Vec<AutoIdleEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::read(&app_handle, &steam_id).await
}

#[tauri::command]
pub async fn add_to_auto_idle_list(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    game: AutoIdleEntry,
) -> AppResult<Vec<AutoIdleEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::add(&app_handle, &steam_id, game).await
}

#[tauri::command]
pub async fn remove_from_auto_idle_list(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<Vec<AutoIdleEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::remove(&app_handle, &steam_id, app_id).await
}

/// Bulk-replaces the queue order - used after drag-reorder. Mirrors
/// `favorites::commands::set_favorites_order`.
#[tauri::command]
pub async fn set_auto_idle_list_order(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    games: Vec<AutoIdleEntry>,
) -> AppResult<Vec<AutoIdleEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::set_order(&app_handle, &steam_id, games).await
}

#[tauri::command]
pub async fn set_auto_idle_enabled(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    enabled: bool,
) -> AppResult<Vec<AutoIdleEntry>> {
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    cache::set_enabled(&app_handle, &steam_id, app_id, enabled).await
}

/// The actual trigger: reads the account's queue, filters to `enabled`, and claims those games
/// under the `"auto_idle"` owner in the shared idle-claims registry (unioned with whatever
/// manual/achievement-unlocker/card-farming already have idling, not a blind full-replace - see
/// `idling::claims`'s module doc comment). Callable both as a Tauri command (the frontend's
/// manual "Start Now" button) and directly from Rust (the app-startup hook that's about to call
/// this via the frontend anyway, and `achievement_unlocker::manager::maybe_start_next_task`'s
/// `"autoIdle"` next-task chain).
///
/// **No hand-rolled retry loop**, unlike `main`'s `startAutoIdleGamesImpl` - `IdlingManager::
/// set_games`'s existing diff-based reconciliation already leaves already-idling overlapping games
/// untouched and naturally retries a previously-failed target on the next call (a failed target is
/// never tracked, so it's still "desired but not yet running" next time), so a single call here is
/// enough. `idling::cap_targets` (applied inside `replace_owner_claim`) already enforces the
/// 32-game cap, so no separate `.take(32)` is needed either.
#[tauri::command]
pub async fn start_auto_idle_games(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    claims: State<'_, IdleClaimsRegistry>,
    auto_stop: State<'_, IdleAutoStopRegistry>,
    account: GamesAccount,
) -> AppResult<IdleSetResult> {
    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }

    let steam_id = resolve_steam_id(&account, &agent_manager).await?;
    let entries = cache::read(&app_handle, &steam_id).await?;
    let queued = entries.len();

    // Playtime lookup for the max-playtime exclusion below - best-effort from the owned-games
    // cache (a read failure degrades to "no known playtime," never blocking the whole trigger).
    let playtime_by_app_id: HashMap<u32, u64> =
        games::commands::get_owned_games_cache(app_handle.clone(), steam_id.clone())
            .unwrap_or_default()
            .into_iter()
            .map(|g| (g.app_id, g.playtime_forever_minutes))
            .collect();

    let mut targets = Vec::new();
    let mut max_playtime_skipped = 0u32;
    for entry in entries.into_iter().filter(|g| g.enabled) {
        let playtime = playtime_by_app_id.get(&entry.app_id).copied().unwrap_or(0);
        if max_playtime::settings::is_over_cap(&app_handle, &steam_id, entry.app_id, playtime)
            .await?
        {
            max_playtime_skipped += 1;
            continue;
        }
        targets.push(IdleTarget {
            app_id: entry.app_id,
            name: entry.name,
        });
    }
    let app_ids: Vec<u32> = targets.iter().map(|t| t.app_id).collect();
    tracing::info!(
        steam_id,
        claimed = targets.len(),
        queued,
        max_playtime_skipped,
        "auto-idle: triggered"
    );

    let result = claims
        .replace_owner_claim(
            &app_handle,
            agent_manager,
            idling_manager,
            account.clone(),
            OWNER_AUTO_IDLE,
            targets,
        )
        .await?;

    // Schedule (or re-arm) each claimed game's "max idle time" timer - see `idling::auto_stop`'s
    // doc comment for why auto-idle shares this cap with manual idling. Every call re-bumps the
    // generation for games already idling too, restarting their countdown; acceptable since this
    // command only fires on real triggers (app-startup, "Start Now," achievement-unlocker's
    // next-task chain), never a tight reconciliation loop.
    for app_id in app_ids {
        auto_stop
            .schedule_if_capped(
                &app_handle,
                &steam_id,
                app_id,
                OWNER_AUTO_IDLE,
                account.clone(),
            )
            .await?;
    }

    Ok(result)
}
