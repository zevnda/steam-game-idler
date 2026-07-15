use tauri::State;

use crate::error::AppResult;
use crate::games::commands::GamesAccount;
use crate::local_steam;
use crate::local_steam::commands::require_steam_running;
use crate::steam_agent::AgentManager;

use super::{AchievementData, BulkAchievementResult, StatUpdate};

/// Fetches achievement/stat data for `app_id`. One command for both sign-in modes, branching
/// internally. Agent mode fails with `unsupported_game_coordinator` for Game Coordinator titles
/// (440/570/730/550/620) - a daemon-only restriction CLI mode doesn't share.
#[tauri::command]
pub async fn get_achievement_data(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<AchievementData> {
    let mut data = match account {
        GamesAccount::Agent { username } => {
            achievements_get_agent_racing_schema_check(&agent_manager, &username, app_id).await?
        }
        GamesAccount::Local { .. } => local_steam::achievements::get_achievement_data(app_id).await?,
    };

    backfill_global_percentages(&mut data, app_id).await;

    Ok(data)
}

/// Races the daemon's `achievements_get` round trip against `web_api::confirm_empty_schema` - only
/// agent mode hits the slow ~7-10s daemon response for a schema-less title (CLI mode's
/// `SteamworksSession` already resolves that case near-instantly, see its `RequestUserStats` doc
/// comment), so only agent mode gets this fast path. The daemon call keeps running even if the
/// schema check loses the race (or errors) - whichever branch below doesn't return immediately
/// falls through to awaiting it directly, so no in-flight daemon response is ever abandoned.
async fn achievements_get_agent_racing_schema_check(
    agent_manager: &AgentManager,
    username: &str,
    app_id: u32,
) -> AppResult<AchievementData> {
    let daemon_fut = agent_manager.achievements_get(username, app_id);
    tokio::pin!(daemon_fut);
    let schema_check_fut = super::web_api::confirm_empty_schema(app_id);
    tokio::pin!(schema_check_fut);

    tokio::select! {
        result = &mut daemon_fut => result,
        result = &mut schema_check_fut => {
            if matches!(result, Ok(true)) {
                tracing::info!(
                    app_id,
                    "achievement manager: confirmed empty schema via Web API, skipping slow daemon round trip"
                );
                Ok(AchievementData { achievements: Vec::new(), stats: Vec::new() })
            } else {
                daemon_fut.await
            }
        }
    }
}

/// Fills in `percent` from the public `GetGlobalAchievementPercentagesForApp` Web API for any
/// achievement that came back without one - in practice always agent mode, since CLI mode already
/// gets it from the native Steamworks call. Best-effort: a failed/slow percentages lookup logs and
/// leaves `percent` unset rather than failing the whole achievement fetch, matching this project's
/// per-item-recoverable logging convention (a missing rarity pill isn't worth losing the rest of
/// the achievement list over).
async fn backfill_global_percentages(data: &mut AchievementData, app_id: u32) {
    if !data.achievements.iter().any(|a| a.percent.is_none()) {
        return;
    }

    match super::web_api::fetch_global_percentages(app_id).await {
        Ok(percentages) => {
            for achievement in &mut data.achievements {
                if achievement.percent.is_none() {
                    achievement.percent = percentages.get(&achievement.id).copied();
                }
            }
        }
        Err(e) => {
            tracing::warn!(
                app_id,
                error = %e,
                "achievement manager: failed to backfill global achievement percentages"
            );
        }
    }
}

/// Unlocks or locks a single achievement. No separate "toggle" command - the frontend already
/// knows an achievement's current `achieved` state from `get_achievement_data`, so it passes the
/// desired `unlock` flag directly (`!achieved` for a toggle-style click).
#[tauri::command]
pub async fn set_achievement(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    achievement_id: String,
    unlock: bool,
) -> AppResult<()> {
    let result = match account {
        GamesAccount::Agent { username } => {
            agent_manager
                .set_achievement(&username, app_id, achievement_id.clone(), unlock)
                .await
        }
        GamesAccount::Local { .. } => {
            require_steam_running()?;
            local_steam::achievements::set_achievement(app_id, &achievement_id, unlock).await
        }
    };
    match &result {
        Ok(()) => {
            tracing::info!(app_id, achievement_id, unlock, "achievement manager: set achievement")
        }
        Err(e) => {
            tracing::warn!(app_id, achievement_id, unlock, error = %e, "achievement manager: set achievement failed")
        }
    }
    result
}

#[tauri::command]
pub async fn unlock_all_achievements(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<BulkAchievementResult> {
    let result = match account {
        GamesAccount::Agent { username } => {
            agent_manager
                .bulk_set_achievements(&username, app_id, true)
                .await
        }
        GamesAccount::Local { .. } => {
            require_steam_running()?;
            local_steam::achievements::unlock_all_achievements(app_id).await
        }
    };
    if let Ok(r) = &result {
        tracing::info!(
            app_id,
            unlock = true,
            succeeded = r.succeeded.len(),
            failed = r.failed.len(),
            skipped = r.skipped.len(),
            "achievement manager: bulk set"
        );
    }
    result
}

#[tauri::command]
pub async fn lock_all_achievements(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<BulkAchievementResult> {
    let result = match account {
        GamesAccount::Agent { username } => {
            agent_manager
                .bulk_set_achievements(&username, app_id, false)
                .await
        }
        GamesAccount::Local { .. } => {
            require_steam_running()?;
            local_steam::achievements::lock_all_achievements(app_id).await
        }
    };
    if let Ok(r) = &result {
        tracing::info!(
            app_id,
            unlock = false,
            succeeded = r.succeeded.len(),
            failed = r.failed.len(),
            skipped = r.skipped.len(),
            "achievement manager: bulk set"
        );
    }
    result
}

#[tauri::command]
pub async fn update_stats(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    stats: Vec<StatUpdate>,
) -> AppResult<()> {
    let stat_count = stats.len();
    let result = match account {
        GamesAccount::Agent { username } => {
            agent_manager.update_stats(&username, app_id, stats).await
        }
        GamesAccount::Local { .. } => {
            require_steam_running()?;
            local_steam::achievements::update_stats(app_id, &stats).await
        }
    };
    if result.is_ok() {
        tracing::info!(app_id, stat_count, "achievement manager: stats updated");
    }
    result
}

#[tauri::command]
pub async fn reset_all_stats(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<()> {
    let result = match account {
        GamesAccount::Agent { username } => agent_manager.reset_all_stats(&username, app_id).await,
        GamesAccount::Local { .. } => {
            require_steam_running()?;
            local_steam::achievements::reset_all_stats(app_id).await
        }
    };
    if result.is_ok() {
        tracing::info!(app_id, "achievement manager: stats reset");
    }
    result
}
