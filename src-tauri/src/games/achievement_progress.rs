//! Per-game achievement completion counts (`OwnedGame::achievements_unlocked`/`_total`), kept in
//! sync with Steam for the whole session rather than only refreshed with the games list.
//!
//! **Source**: `IPlayerService/GetTopAchievementsForGames` in both sign-in modes - over the daemon's
//! own authenticated session in agent mode (`Daemon/Bot/AchievementProgressManager.cs`, immune to
//! profile privacy), over the public Web API in CLI mode (`web_api::fetch_achievement_progress`).
//! Batched (~200 games per request), so a 1,000-game library is a handful of requests, not 1,000.
//!
//! **CLI mode only runs with the user's own Web API key** - never the embedded shared one, whose
//! daily quota is pooled across every install and backs features that matter far more than a sort
//! option (see `web_api::fetch_achievement_progress`'s doc comment for the cost). Without one,
//! every refresh below is a no-op for that account and the frontend hides the achievement sorts
//! (`useOwnedGameSort`'s eligibility check, the same gate "Recently Played" already uses).
//! Both were measured live to reflect an unlock *and* a lock immediately; the more obvious
//! `GetAchievementsProgress` was not used because it serves a server-side cache that stayed stale
//! for minutes (see the C# class's doc comment).
//!
//! **Staying in sync**: everything funnels into [`schedule_refresh`], which re-fetches just the
//! given games, patches the owned-games cache, and emits [`ACHIEVEMENT_PROGRESS_EVENT`] so the
//! frontend's `gamesListStore` patches in place (`useAchievementProgressSync`). Its call sites:
//! - every achievement-mutating command in `achievements::commands` (Achievement Manager edits,
//!   the achievement unlocker's per-achievement unlocks, which call the same `set_achievement`,
//!   and the Debug tab's library-wide run);
//! - agent mode's `playing_session` ending (`steam_agent::process`) - the user played a game on
//!   their real Steam client and may have earned achievements legitimately;
//! - `commands::get_owned_games`, for the whole library (throttled, see
//!   [`LIBRARY_REFRESH_MIN_INTERVAL`]).
//!
//! CLI mode has no "finished playing" signal, so achievements earned by legitimately playing are
//! picked up by the next library-wide refresh instead - deliberately not polled any harder, since
//! even the user's own key has its own daily quota.
//!
//! Every refresh is best-effort: a failed fetch logs and keeps the previously cached counts rather
//! than clearing them, and `get_owned_games` carries cached counts forward into each fresh list so
//! the list never flashes back to "unknown" while a refresh is in flight.

use std::collections::{HashMap, HashSet};
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::error::AppResult;
use crate::steam_agent::AgentManager;

use super::commands::{resolve_steam_id, GamesAccount};
use super::{cache, web_api, AchievementProgress, OwnedGame};

/// Emitted with [`ProgressEvent`] whenever a refresh changes at least one game's counts.
pub const ACHIEVEMENT_PROGRESS_EVENT: &str = "achievement-progress-updated";

/// How long [`schedule_refresh`] waits before fetching, so a burst of calls (a Debug-tab library
/// run finishing games concurrently, several staged saves in a row) becomes one batched request
/// instead of one per call. Short enough that an edit still feels immediate in the games list.
const COALESCE_WINDOW: Duration = Duration::from_secs(2);

/// One retry for a refresh whose fetch failed outright - the common case is agent mode's
/// `playing_session` ending, which lands while the daemon is still reconnecting from the
/// "logged in elsewhere" kick that started the session.
const RETRY_DELAY: Duration = Duration::from_secs(15);

/// Minimum gap between two library-wide refreshes for the same account unless forced. The
/// games-list auto-update polls every 1-5 minutes (`useAutoUpdateGamesListStatus`), and
/// re-fetching every game's counts that often would mostly spend the user's own Web API key
/// quota (CLI mode) or Steam round trips (agent mode) on unchanged data - every in-app change is
/// already refreshed directly (see the module doc comment), so this only bounds how long a
/// CLI-mode legitimate-play unlock can lag.
const LIBRARY_REFRESH_MIN_INTERVAL: Duration = Duration::from_secs(15 * 60);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressEvent {
    account: GamesAccount,
    progress: Vec<AchievementProgress>,
}

/// App ids waiting for the next coalesced fetch, per account. An entry existing at all means a
/// flush task for that account is already running and will pick up anything added to it.
struct Pending {
    account: GamesAccount,
    app_ids: HashSet<u32>,
}

static PENDING: LazyLock<Mutex<HashMap<String, Pending>>> = LazyLock::new(Default::default);

/// When each account (by SteamID64) last had a library-wide refresh scheduled.
static LAST_LIBRARY_REFRESH: LazyLock<Mutex<HashMap<String, Instant>>> =
    LazyLock::new(Default::default);

/// CLI-mode SteamID64s whose last `GetOwnedGames` came back privacy-blocked (`possibly_private`).
/// The same privacy setting hides achievement data from the Web API, and a blocked response isn't
/// an error - it returns a handful of games with zero totals, which would read as "no
/// achievements" rather than "unknown". So refreshes for these accounts are skipped entirely.
/// Rare now that CLI mode requires the user's own key (which sees its own account regardless of
/// privacy), but still reachable when that key belongs to a different account than the one signed
/// in to the local Steam client.
static PRIVACY_BLOCKED: LazyLock<Mutex<HashSet<String>>> = LazyLock::new(Default::default);

fn pending_key(account: &GamesAccount) -> String {
    match account {
        GamesAccount::Agent { username } => format!("agent:{}", username.to_lowercase()),
        GamesAccount::Local { steam_id } => format!("local:{steam_id}"),
    }
}

/// Queues `app_ids` for a coalesced re-fetch of their achievement counts (see
/// [`COALESCE_WINDOW`]). Safe to call from any thread, sync or async - the flush runs on
/// `tauri::async_runtime`, never a bare `tokio::spawn` (see CLAUDE.md's no-reactor trap).
pub fn schedule_refresh(
    app_handle: &AppHandle,
    account: &GamesAccount,
    app_ids: impl IntoIterator<Item = u32>,
) {
    let key = pending_key(account);
    let start_flush = {
        let mut pending = PENDING.lock().unwrap_or_else(|e| e.into_inner());
        match pending.get_mut(&key) {
            Some(entry) => {
                entry.app_ids.extend(app_ids);
                false
            }
            None => {
                pending.insert(
                    key.clone(),
                    Pending {
                        account: account.clone(),
                        app_ids: app_ids.into_iter().collect(),
                    },
                );
                true
            }
        }
    };

    if start_flush {
        let app_handle = app_handle.clone();
        tauri::async_runtime::spawn(async move { flush_loop(app_handle, key).await });
    }
}

/// Library-wide counterpart to [`schedule_refresh`], throttled per account by
/// [`LIBRARY_REFRESH_MIN_INTERVAL`] unless `force` is set (a first load or an explicit refresh
/// click - see `commands::get_owned_games`).
pub fn schedule_library_refresh(
    app_handle: &AppHandle,
    account: &GamesAccount,
    steam_id: &str,
    app_ids: impl IntoIterator<Item = u32>,
    force: bool,
) {
    if claim_library_refresh(steam_id, force) {
        schedule_refresh(app_handle, account, app_ids);
    }
}

/// Whether a library-wide refresh for `steam_id` should run now, recording it as the latest if so.
fn claim_library_refresh(steam_id: &str, force: bool) -> bool {
    let mut last = LAST_LIBRARY_REFRESH
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    let now = Instant::now();
    if !force
        && last
            .get(steam_id)
            .is_some_and(|at| now.duration_since(*at) < LIBRARY_REFRESH_MIN_INTERVAL)
    {
        return false;
    }
    last.insert(steam_id.to_string(), now);
    true
}

/// Records whether a CLI-mode account's Web API data is privacy-blocked - see [`PRIVACY_BLOCKED`].
pub fn set_privacy_blocked(steam_id: &str, blocked: bool) {
    let mut set = PRIVACY_BLOCKED.lock().unwrap_or_else(|e| e.into_inner());
    if blocked {
        set.insert(steam_id.to_string());
    } else {
        set.remove(steam_id);
    }
}

fn is_privacy_blocked(steam_id: &str) -> bool {
    PRIVACY_BLOCKED
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .contains(steam_id)
}

/// Copies each game's last known counts from `previous` (the cache as it was before this fetch)
/// into a freshly merged list, whose backends never populate them themselves.
pub fn carry_forward(previous: &[OwnedGame], games: &mut [OwnedGame]) {
    let known: HashMap<u32, (Option<u32>, Option<u32>)> = previous
        .iter()
        .map(|g| (g.app_id, (g.achievements_unlocked, g.achievements_total)))
        .collect();
    for game in games {
        if let Some(&(unlocked, total)) = known.get(&game.app_id) {
            game.achievements_unlocked = unlocked;
            game.achievements_total = total;
        }
    }
}

async fn flush_loop(app_handle: AppHandle, key: String) {
    loop {
        tokio::time::sleep(COALESCE_WINDOW).await;

        // Taken and, once drained, removed under the same lock `schedule_refresh` inserts under,
        // so an id can't be added to an entry this loop has already decided to abandon.
        let (account, app_ids) = {
            let mut pending = PENDING.lock().unwrap_or_else(|e| e.into_inner());
            let Some(entry) = pending.get_mut(&key) else {
                return;
            };
            if entry.app_ids.is_empty() {
                pending.remove(&key);
                return;
            }
            let app_ids: Vec<u32> = entry.app_ids.drain().collect();
            (entry.account.clone(), app_ids)
        };

        if let Err(e) = refresh_now(&app_handle, &account, &app_ids).await {
            tracing::warn!(
                account = %key,
                games = app_ids.len(),
                error = %e,
                "achievement progress: refresh failed, retrying once"
            );
            tokio::time::sleep(RETRY_DELAY).await;
            if let Err(e) = refresh_now(&app_handle, &account, &app_ids).await {
                tracing::warn!(
                    account = %key,
                    games = app_ids.len(),
                    error = %e,
                    "achievement progress: refresh failed again, keeping cached counts"
                );
            }
        }
    }
}

async fn refresh_now(
    app_handle: &AppHandle,
    account: &GamesAccount,
    app_ids: &[u32],
) -> AppResult<()> {
    let agent_manager = app_handle.state::<AgentManager>();
    let steam_id = resolve_steam_id(account, &agent_manager).await?;

    let fetched = match account {
        GamesAccount::Agent { username } => {
            agent_manager
                .achievements_progress(username, app_ids.to_vec())
                .await?
        }
        GamesAccount::Local { .. } => {
            // See the module doc comment - no own key means no call at all, never the shared key.
            let Some(own_api_key) = crate::credential_store::load_web_api_key()
                .filter(|key| !key.trim().is_empty())
            else {
                return Ok(());
            };
            if is_privacy_blocked(&steam_id) {
                return Ok(());
            }
            web_api::fetch_achievement_progress(&steam_id, &own_api_key, app_ids).await?
        }
    };

    let by_app_id: HashMap<u32, AchievementProgress> =
        fetched.iter().map(|p| (p.app_id, *p)).collect();
    let mut changed = Vec::new();
    cache::update(app_handle, &steam_id, |games| {
        for game in games.iter_mut() {
            let Some(progress) = by_app_id.get(&game.app_id) else {
                continue;
            };
            if game.achievements_unlocked != Some(progress.unlocked)
                || game.achievements_total != Some(progress.total)
            {
                game.achievements_unlocked = Some(progress.unlocked);
                game.achievements_total = Some(progress.total);
                changed.push(*progress);
            }
        }
        !changed.is_empty()
    })?;

    tracing::info!(
        steam_id,
        requested = app_ids.len(),
        returned = fetched.len(),
        changed = changed.len(),
        "achievement progress: refreshed"
    );

    if !changed.is_empty() {
        let _ = app_handle.emit(
            ACHIEVEMENT_PROGRESS_EVENT,
            ProgressEvent {
                account: account.clone(),
                progress: changed,
            },
        );
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn game(app_id: u32, unlocked: Option<u32>, total: Option<u32>) -> OwnedGame {
        OwnedGame {
            app_id,
            name: None,
            playtime_forever_minutes: 0,
            rtime_last_played: 0,
            last_refund_eligible_purchase_unix_seconds: None,
            achievements_unlocked: unlocked,
            achievements_total: total,
        }
    }

    #[test]
    fn carry_forward_keeps_known_counts_and_leaves_new_games_unknown() {
        let previous = vec![game(1, Some(3), Some(10)), game(2, Some(0), Some(0))];
        let mut fresh = vec![
            game(1, None, None),
            game(2, None, None),
            game(3, None, None),
        ];
        carry_forward(&previous, &mut fresh);
        assert_eq!(
            fresh
                .iter()
                .map(|g| (g.app_id, g.achievements_unlocked, g.achievements_total))
                .collect::<Vec<_>>(),
            vec![
                (1, Some(3), Some(10)),
                (2, Some(0), Some(0)),
                (3, None, None)
            ]
        );
    }

    #[test]
    fn library_refresh_is_throttled_per_account_unless_forced() {
        assert!(claim_library_refresh("test-throttle-a", false));
        assert!(!claim_library_refresh("test-throttle-a", false));
        assert!(claim_library_refresh("test-throttle-a", true));
        assert!(claim_library_refresh("test-throttle-b", false));
    }
}
