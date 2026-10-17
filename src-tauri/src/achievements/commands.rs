use futures::stream::{self, StreamExt};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::achievement_unlocker::AchievementUnlockerManager;
use crate::error::{AppError, AppResult};
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::local_steam;
use crate::local_steam::commands::require_steam_running;
use crate::steam_agent::AgentManager;

use super::library_run::LibraryRunRegistry;
use super::{AchievementData, BulkAchievementResult, StatUpdate};

/// Fetches achievement/stat data for `app_id`. One command for both sign-in modes, branching
/// internally. Agent mode fails with `unsupported_game_coordinator` for Game Coordinator titles
/// (440/570/730/550/620) - a daemon-only restriction CLI mode doesn't share.
///
/// `locale` is the frontend's own i18next locale (`i18n.language`, e.g. `"it-IT"`), mapped to a
/// Steam schema language key via `steam_language::steam_language_for_locale`. Only agent mode
/// uses it - CLI mode already gets live-localized text from the local Steam client itself, see
/// that module's doc comment for why this app's locale can't influence CLI mode the same way.
#[tauri::command]
pub async fn get_achievement_data(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
    locale: String,
) -> AppResult<AchievementData> {
    let mut data = match account {
        GamesAccount::Agent { username } => {
            let steam_language = super::steam_language::steam_language_for_locale(&locale);
            achievements_get_agent_racing_schema_check(
                &agent_manager,
                &username,
                app_id,
                steam_language,
            )
            .await?
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
    steam_language: &'static str,
) -> AppResult<AchievementData> {
    let daemon_fut = agent_manager.achievements_get(username, app_id, steam_language);
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
                Ok(AchievementData {
                    achievements: Vec::new(),
                    stats: Vec::new(),
                    groups: Vec::new(),
                })
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
    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }
    set_all(&agent_manager, &account, app_id, true).await
}

#[tauri::command]
pub async fn lock_all_achievements(
    agent_manager: State<'_, AgentManager>,
    account: GamesAccount,
    app_id: u32,
) -> AppResult<BulkAchievementResult> {
    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }
    set_all(&agent_manager, &account, app_id, false).await
}

/// Shared body of `unlock_all_achievements`/`lock_all_achievements`/
/// `set_all_owned_games_achievements`. Leaves the `require_steam_running` check to its callers -
/// it's a process-list scan, so the library-wide command does it once up front rather than once per
/// owned game.
async fn set_all(
    agent_manager: &AgentManager,
    account: &GamesAccount,
    app_id: u32,
    unlock: bool,
) -> AppResult<BulkAchievementResult> {
    let result = match account {
        GamesAccount::Agent { username } => {
            agent_manager
                .bulk_set_achievements(username, app_id, unlock)
                .await
        }
        GamesAccount::Local { .. } => {
            if unlock {
                local_steam::achievements::unlock_all_achievements(app_id).await
            } else {
                local_steam::achievements::lock_all_achievements(app_id).await
            }
        }
    };
    match &result {
        Ok(r) => tracing::info!(
            app_id,
            unlock,
            succeeded = r.succeeded.len(),
            failed = r.failed.len(),
            skipped = r.skipped.len(),
            "achievement manager: bulk set"
        ),
        Err(e) => {
            tracing::warn!(app_id, unlock, error = %e, "achievement manager: bulk set failed")
        }
    }
    result
}

/// How many owned games `set_all_owned_games_achievements` works on at once. CLI mode is further
/// capped by `local_steam::achievements`' own process semaphore (one `SteamUtility.exe` spawn per
/// game), so this mostly governs agent mode, where every game is a concurrent daemon request on the
/// account's one SteamKit2 connection - kept below the achievement unlocker's 32-game ceiling since
/// this burst runs back-to-back across an entire library rather than one bounded batch.
const LIBRARY_RUN_CONCURRENCY: usize = 16;

/// Emitted by `set_all_owned_games_achievements` once up front (`completed: 0`) and again as each
/// owned game finishes. Payload is `{"steamId", "completed", "total", "achievementsChanged"}`.
pub const LIBRARY_RUN_PROGRESS_EVENT: &str = "library-achievement-run-progress";

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryBulkSetResult {
    pub games_total: usize,
    /// Games where at least one achievement actually changed state.
    pub games_changed: usize,
    /// Games whose bulk set errored outright (e.g. a Game Coordinator title in agent mode), or that
    /// came back with any per-achievement failure.
    pub games_failed: usize,
    pub achievements_changed: usize,
}

/// Debug-tab action: locks (`unlock: false`) or unlocks (`unlock: true`) every achievement in
/// every game in this account's cached owned-games list (the same `games::cache` the games-list
/// page reads, so it covers exactly what the user sees there). Each game first goes through
/// `web_api::confirm_empty_schema` - most libraries are dominated by achievement-less titles, and
/// agent mode otherwise waits out the daemon's ~7-10s negative lookup for each one (see that
/// function's doc comment). A failed schema check just falls through to the real call, same
/// fail-open handling `get_achievement_data` uses.
///
/// Refuses to start while the achievement unlocker is running for the account, or while another
/// library run is - see `library_run`'s module doc comment. One game failing is logged (inside
/// `set_all`) and counted, never aborting the rest. Protected achievements (and, when unlocking,
/// unowned-DLC achievement sets) are skipped by both backends' bulk setters as usual.
///
/// Deliberately not tier-gated at all (a product decision for this Debug-tab tool, even though it
/// overlaps the achievement unlocker's tier-capped concurrency) - not an oversight.
#[tauri::command]
pub async fn set_all_owned_games_achievements(
    app_handle: AppHandle,
    agent_manager: State<'_, AgentManager>,
    unlocker_manager: State<'_, AchievementUnlockerManager>,
    library_runs: State<'_, LibraryRunRegistry>,
    account: GamesAccount,
    unlock: bool,
) -> AppResult<LibraryBulkSetResult> {
    if matches!(account, GamesAccount::Local { .. }) {
        require_steam_running()?;
    }
    let steam_id = resolve_steam_id(&account, &agent_manager).await?;

    // Claim the slot before checking the unlocker, so `start_achievement_unlocker`'s own
    // registry check sees this run from here on.
    let Some(_run_guard) = library_runs.try_begin(&steam_id) else {
        tracing::warn!(
            steam_id,
            unlock,
            "library achievement run: refused, one is already running"
        );
        return Err(AppError::LibraryAchievementRunInProgress);
    };
    if unlocker_manager.is_running(&steam_id).await {
        tracing::warn!(
            steam_id,
            unlock,
            "library achievement run: refused, the achievement unlocker is running"
        );
        return Err(AppError::AchievementUnlockerRunning);
    }

    let games = crate::games::cache::read(&app_handle, &steam_id)?;
    tracing::info!(
        steam_id,
        unlock,
        games = games.len(),
        "library achievement run: started"
    );

    let mut summary = LibraryBulkSetResult {
        games_total: games.len(),
        ..Default::default()
    };
    let mut completed = 0;
    // An initial 0-of-N event so the frontend can show the total straight away, rather than only
    // once the first (possibly slow) game finishes.
    emit_library_run_progress(&app_handle, &steam_id, completed, &summary);

    let agent_manager = agent_manager.inner();
    let account = &account;
    let mut outcomes = stream::iter(games)
        .map(|game| async move {
            if matches!(
                super::web_api::confirm_empty_schema(game.app_id).await,
                Ok(true)
            ) {
                return None;
            }
            Some(set_all(agent_manager, account, game.app_id, unlock).await)
        })
        .buffer_unordered(LIBRARY_RUN_CONCURRENCY);

    // Folded as each game finishes (not collected first) so progress can be reported live.
    while let Some(outcome) = outcomes.next().await {
        match outcome {
            Some(Ok(r)) => {
                summary.achievements_changed += r.succeeded.len();
                if !r.succeeded.is_empty() {
                    summary.games_changed += 1;
                }
                if !r.failed.is_empty() {
                    summary.games_failed += 1;
                }
            }
            Some(Err(_)) => summary.games_failed += 1,
            None => {}
        }
        completed += 1;
        emit_library_run_progress(&app_handle, &steam_id, completed, &summary);
    }

    tracing::info!(
        steam_id,
        unlock,
        games_total = summary.games_total,
        games_changed = summary.games_changed,
        games_failed = summary.games_failed,
        achievements_changed = summary.achievements_changed,
        "library achievement run: finished"
    );
    Ok(summary)
}

fn emit_library_run_progress(
    app_handle: &AppHandle,
    steam_id: &str,
    completed: usize,
    summary: &LibraryBulkSetResult,
) {
    let _ = app_handle.emit(
        LIBRARY_RUN_PROGRESS_EVENT,
        serde_json::json!({
            "steamId": steam_id,
            "completed": completed,
            "total": summary.games_total,
            "achievementsChanged": summary.achievements_changed,
        }),
    );
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
