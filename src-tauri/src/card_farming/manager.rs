//! The farming-cycle background task: idles up to [`MAX_CONCURRENT_FARMING`] games with card drops
//! remaining *concurrently*, polls each one's remaining count, drops finished games out of the
//! active set and backfills more from the queue as slots free up, repeats until the account has
//! none left - see `mod.rs`'s doc comment for why this matches `main`'s concurrency but not its
//! toggle-timing design. Calls `idling::claims::IdleClaimsRegistry::replace_owner_claim` (owner
//! `OWNER_CARD_FARMING`) for the actual idling mechanics - not `idling::commands::set_idle_games`
//! directly, since that would full-replace the real announced set and stomp whatever manual/
//! auto-idle/achievement-unlocker idling is also currently claimed (see `idling::claims`'s module
//! doc comment). This module owns no process/spawn logic of its own.

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use futures::future::join_all;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

use crate::achievement_unlocker;
use crate::async_utils::wait_ticking;
use crate::auto_idle;
use crate::error::AppResult;
use crate::games::{self, commands::GamesAccount};
use crate::idling::{self, IdleTarget, IdlingManager};
use crate::max_playtime;
use crate::steam_agent::AgentManager;

use super::settings::FarmingCaps;
use super::{
    queue, scraper, settings, CompletedFarm, CompletedFarmReason, FarmingProgress, FarmingState,
    GameWithDrops, SteamCookies,
};
use super::{DROPS_POLL_INTERVAL, FARMING_STATE_EVENT};

/// Mirrors `idling`'s own concurrent-games cap (a real Steam protocol limit - see that module's doc
/// comment on `MAX_CONCURRENT_GAMES`), defined again here (rather than reaching into `idling`'s
/// private internals) so this module's own active-set bookkeeping stays consistent with what the
/// idling claims registry will actually accept.
const MAX_CONCURRENT_FARMING: usize = 32;

/// Fetches this account's current games-with-drops list, restricted to `queued_app_ids` and
/// ordered per the account's `drop_sort_order` preference (`main`'s `sortByHighestDrops`/
/// `sortByLowestDrops`, collapsed into one enum - see `settings::DropSortOrder`'s doc comment).
/// Shared by [`CardFarmingManager::start`] (the initial queue) and `run_cycle`'s mid-session
/// refetch so both apply the same ordering rather than one honoring the setting and the other not.
///
/// Also dequeues and returns (as the second element) any game already over its max-playtime cap -
/// mirrors `achievement_unlocker::manager::run_scan_phase`'s identical pre-check/dequeue, so a game
/// that's over cap before it's ever farmed doesn't just silently vanish from the queue with nothing
/// to show for it in the "session finished" summary the caller builds from this.
async fn fetch_queued_games(
    app_handle: &AppHandle,
    steam_id: &str,
    cookies: &SteamCookies,
    queued_app_ids: &HashSet<u32>,
) -> AppResult<(Vec<GameWithDrops>, Vec<CompletedFarm>)> {
    let mut games = scraper::get_games_with_drops(steam_id, cookies).await?;
    games.retain(|g| queued_app_ids.contains(&g.app_id));

    // Exclude games that have already reached their max-playtime cap - `playtime_hours` above is
    // a different, badge-page-scraped display value, not real playtime, so this needs its own
    // owned-games-cache lookup rather than reusing it. Best-effort: a read failure degrades to
    // "no known playtime" for every game rather than failing the whole candidate fetch.
    let playtime_by_app_id = playtime_lookup(app_handle, steam_id);
    let mut kept = Vec::with_capacity(games.len());
    let mut excluded = Vec::new();
    for game in games {
        let playtime = playtime_by_app_id.get(&game.app_id).copied().unwrap_or(0);
        if max_playtime::settings::is_over_cap(app_handle, steam_id, game.app_id, playtime).await? {
            if let Err(e) = queue::remove(app_handle, steam_id, game.app_id).await {
                tracing::warn!(app_id = game.app_id, error = %e.code(), "card farming: failed to remove over-max-playtime game from queue");
            } else {
                tracing::info!(
                    app_id = game.app_id,
                    "card farming: removed over-max-playtime game from queue"
                );
            }
            excluded.push(CompletedFarm {
                app_id: game.app_id,
                name: game.name,
                remaining: game.remaining,
                reason: CompletedFarmReason::MaxPlaytime,
            });
            continue;
        }
        kept.push(game);
    }
    let mut games = kept;

    let drop_sort_order = settings::get(app_handle, steam_id).await?.drop_sort_order;
    sort_by_drop_order(&mut games, drop_sort_order);
    Ok((games, excluded))
}

/// Best-effort `app_id -> playtime_forever_minutes` lookup from the owned-games cache - shared by
/// [`fetch_queued_games`]'s candidate filter and [`backfill_active`]'s per-game baseline. A read
/// failure degrades to an empty map (every game reads as "0 minutes known") rather than failing
/// the caller outright.
fn playtime_lookup(app_handle: &AppHandle, steam_id: &str) -> HashMap<u32, u64> {
    games::commands::get_owned_games_cache(app_handle.clone(), steam_id.to_string())
        .unwrap_or_default()
        .into_iter()
        .map(|g| (g.app_id, g.playtime_forever_minutes))
        .collect()
}

/// Pure sort step split out of [`fetch_queued_games`] so it's unit-testable without the
/// network/settings-file I/O around it - mirrors `is_capped`'s split for the same reason.
fn sort_by_drop_order(games: &mut [GameWithDrops], order: settings::DropSortOrder) {
    match order {
        settings::DropSortOrder::HighestFirst => {
            games.sort_by(|a, b| b.remaining.cmp(&a.remaining))
        }
        settings::DropSortOrder::LowestFirst => games.sort_by(|a, b| a.remaining.cmp(&b.remaining)),
    }
}

struct FarmingSession {
    handle: JoinHandle<()>,
    stopped: Arc<AtomicBool>,
    state: Arc<Mutex<FarmingState>>,
}

/// Tracks at most one farming cycle per account (keyed by resolved SteamID64, matching
/// `favorites`/`games`'s cache-keying convention), each running as its own background task.
#[derive(Default)]
pub struct CardFarmingManager {
    sessions: Mutex<HashMap<String, FarmingSession>>,
}

impl CardFarmingManager {
    pub fn new() -> Self {
        Self::default()
    }

    /// Starts a farming cycle for `steam_id` if one isn't already running - idempotent, mirroring
    /// `favorites::add_favorite`'s "calling it again is a no-op" convention: a second `start` call
    /// while one is already in flight just returns its current state rather than restarting
    /// anything. `queued_app_ids` is the account's curated card-farming queue (see `queue.rs`) -
    /// only games with drops remaining that are also in this set are farmed; everything else
    /// `get_games_with_drops` returns is left alone. Returns an empty/not-farming `FarmingState`
    /// (no task spawned) only if `queued_app_ids` itself is empty - mirrors
    /// `achievement_unlocker::manager::start`'s identical "nothing was ever queued" check. Unlike an
    /// earlier version of this method, a *non-empty* queue that comes back with nothing farmable
    /// (every game already over its max-playtime cap) still spawns [`run_cycle`] rather than
    /// returning early: only the spawned task ever emits [`FARMING_STATE_EVENT`], so skipping the
    /// spawn meant the "session finished" summary for that case (`fetch_queued_games`'s own
    /// dequeue-with-reason below) had no way to ever reach the frontend.
    pub async fn start(
        &self,
        app_handle: &AppHandle,
        steam_id: String,
        account: GamesAccount,
        cookies: SteamCookies,
        mut queued_app_ids: HashSet<u32>,
    ) -> AppResult<FarmingState> {
        {
            let sessions = self.sessions.lock().await;
            if let Some(session) = sessions.get(&steam_id) {
                return Ok(session.state.lock().await.clone());
            }
        }

        if queued_app_ids.is_empty() {
            return Ok(FarmingState::default());
        }

        let (games, excluded) =
            fetch_queued_games(app_handle, &steam_id, &cookies, &queued_app_ids).await?;
        tracing::info!(
            steam_id,
            queue_len = games.len(),
            excluded_len = excluded.len(),
            "card farming: session started"
        );

        // `run_cycle`'s own mid-session refetch (once `active`/`queue` both empty) filters the
        // scraper's response through this same `queued_app_ids` set - a game excluded above (over
        // its max-playtime cap) can easily still have real drops remaining, so it would otherwise
        // still pass that filter and get pre-checked/excluded a second time, duplicating this exact
        // `CompletedFarm` entry in the summary the user sees. Pruning here keeps the set in sync
        // with what's actually still eligible.
        for excluded_game in &excluded {
            queued_app_ids.remove(&excluded_game.app_id);
        }

        let state = Arc::new(Mutex::new(FarmingState {
            is_farming: true,
            queue: games,
            completed: excluded,
            ..Default::default()
        }));
        let stopped = Arc::new(AtomicBool::new(false));

        let handle = tokio::spawn(run_cycle(
            app_handle.clone(),
            steam_id.clone(),
            account,
            cookies,
            state.clone(),
            stopped.clone(),
            queued_app_ids,
        ));

        let snapshot = state.lock().await.clone();
        self.sessions.lock().await.insert(
            steam_id,
            FarmingSession {
                handle,
                stopped,
                state,
            },
        );
        Ok(snapshot)
    }

    /// Stops `steam_id`'s farming cycle if one is running - idempotent (a no-op if nothing is
    /// tracked). Sets a flag rather than aborting the task outright, so the task always reaches
    /// its own cleanup (stop idling, clear state) instead of being killed mid-`set_idle_games`
    /// call and potentially leaving games idling with nothing left to stop them.
    pub async fn stop(&self, steam_id: &str) -> AppResult<()> {
        let session = self.sessions.lock().await.remove(steam_id);
        let Some(session) = session else {
            return Ok(());
        };
        session.stopped.store(true, Ordering::SeqCst);
        let _ = session.handle.await;
        Ok(())
    }

    pub async fn state(&self, steam_id: &str) -> FarmingState {
        match self.sessions.lock().await.get(steam_id) {
            Some(session) => session.state.lock().await.clone(),
            None => FarmingState::default(),
        }
    }

    async fn remove(&self, steam_id: &str) {
        self.sessions.lock().await.remove(steam_id);
    }
}

/// Moves games from `queue` into `active` until `active` reaches [`MAX_CONCURRENT_FARMING`] or
/// `queue` runs out - returns `true` if anything was added (the caller uses this to decide whether
/// the idling set needs to be re-announced). `playtime_by_app_id` seeds each newly-active game's
/// [`FarmingProgress::baseline_playtime_minutes`] - see that field's doc comment.
fn backfill_active(farming: &mut FarmingState, playtime_by_app_id: &HashMap<u32, u64>) -> bool {
    let mut added = false;
    while farming.active.len() < MAX_CONCURRENT_FARMING {
        let Some(game) = (!farming.queue.is_empty()).then(|| farming.queue.remove(0)) else {
            break;
        };
        tracing::info!(
            app_id = game.app_id,
            name = %game.name,
            remaining = game.remaining,
            "card farming: started farming"
        );
        farming.active.push(FarmingProgress {
            app_id: game.app_id,
            name: game.name,
            initial_remaining: game.remaining,
            remaining: game.remaining,
            playtime_hours: game.playtime_hours,
            started_at: Instant::now(),
            baseline_playtime_minutes: playtime_by_app_id.get(&game.app_id).copied().unwrap_or(0),
        });
        added = true;
    }
    added
}

/// Effective per-game cap check, pure and unit-testable (no network/lock access) - mirrors
/// `idling::settings::effective_max_idle_time`'s per-game-wins-if-set-else-global precedence for
/// `maxCardFarmingTime`; `maxCardDrops` has no global override in `main` either, so it's per-game
/// only. Returns `None` when neither cap is hit.
fn is_capped(progress: &FarmingProgress, caps: &FarmingCaps) -> Option<CompletedFarmReason> {
    let drops_farmed = progress
        .initial_remaining
        .saturating_sub(progress.remaining);
    let max_drops = caps
        .per_game_max_card_drops
        .get(&progress.app_id)
        .copied()
        .filter(|&v| v > 0);
    if max_drops.is_some_and(|max| drops_farmed >= max) {
        return Some(CompletedFarmReason::MaxCardDrops);
    }

    let max_minutes = caps
        .per_game_max_card_farming_time
        .get(&progress.app_id)
        .copied()
        .filter(|&v| v > 0)
        .or(Some(caps.global_max_card_farming_time).filter(|&v| v > 0));
    if let Some(minutes) = max_minutes {
        if progress.started_at.elapsed() >= Duration::from_secs(u64::from(minutes) * 60) {
            return Some(CompletedFarmReason::MaxCardFarmingTime);
        }
    }

    None
}

/// Polls every currently-active game's remaining drop count concurrently (mirrors `scraper`'s own
/// `join_all` shape for badge-page pagination), updates `state`, and moves any game whose drops hit
/// zero *or* whose `caps` auto-stop condition is met into `completed` - returns `true` if anything
/// finished, since a finished game must stop idling immediately, not just get requeued next poll.
///
/// Every reason now also dequeues the game from the account's *persisted* `queue` (mirrors
/// `achievement_unlocker::manager`'s identical dequeue-on-any-terminal-outcome behavior) - an
/// earlier version of this function only dequeued on a genuine `DropsExhausted`, reasoning that a
/// cap-based stop could leave real drops remaining and so should stay queued for next time. That
/// asymmetry with achievement-unlocker (which always dequeues) was a source of user confusion, so
/// both features now behave the same way: a cap-based stop is just as final as a genuine finish for
/// *this account's queue* - raising the cap and re-adding the game is an explicit, deliberate action
/// rather than something that silently resumes on its own.
async fn poll_active(
    app_handle: &AppHandle,
    state: &Arc<Mutex<FarmingState>>,
    steam_id: &str,
    cookies: &SteamCookies,
    caps: &FarmingCaps,
    queued_app_ids: &mut HashSet<u32>,
) -> bool {
    let app_ids: Vec<u32> = state.lock().await.active.iter().map(|p| p.app_id).collect();
    if app_ids.is_empty() {
        return false;
    }

    let results = join_all(app_ids.iter().map(|&app_id| async move {
        (
            app_id,
            scraper::get_drops_remaining(steam_id, app_id, cookies).await,
        )
    }))
    .await;

    let mut s = state.lock().await;
    for (app_id, result) in results {
        match result {
            Ok(drops) => {
                if let Some(progress) = s.active.iter_mut().find(|p| p.app_id == app_id) {
                    progress.remaining = drops.remaining;
                }
            }
            Err(e) => {
                tracing::warn!(
                    app_id,
                    error = %e.code(),
                    "card farming: failed to check drops remaining, retrying next poll"
                );
            }
        }
    }

    let mut finished = Vec::new();
    let mut i = 0;
    while i < s.active.len() {
        let reason = if s.active[i].remaining == 0 {
            Some(CompletedFarmReason::DropsExhausted)
        } else {
            is_capped(&s.active[i], caps)
        };
        let Some(reason) = reason else {
            i += 1;
            continue;
        };
        finished.push((s.active.remove(i), reason));
    }
    drop(s);

    // Max-playtime auto-stop - a separate async pass (needs an I/O read `is_capped` above
    // deliberately avoids) rather than folded into `is_capped` itself, checking every game that
    // *didn't* already stop for another reason this poll.
    let mut i = 0;
    let mut still_active = state.lock().await;
    while i < still_active.active.len() {
        let progress = &still_active.active[i];
        let estimated_minutes =
            progress.baseline_playtime_minutes + progress.started_at.elapsed().as_secs() / 60;
        let over_cap = max_playtime::settings::is_over_cap(
            app_handle,
            steam_id,
            progress.app_id,
            estimated_minutes,
        )
        .await
        .unwrap_or(false);
        if over_cap {
            finished.push((
                still_active.active.remove(i),
                CompletedFarmReason::MaxPlaytime,
            ));
        } else {
            i += 1;
        }
    }
    drop(still_active);

    let finished_any = !finished.is_empty();
    for (done, reason) in finished {
        match reason {
            CompletedFarmReason::DropsExhausted => {
                tracing::info!(app_id = done.app_id, name = %done.name, "card farming: drops exhausted");
            }
            CompletedFarmReason::MaxCardDrops => {
                tracing::info!(app_id = done.app_id, name = %done.name, "card farming: max card drops cap reached");
            }
            CompletedFarmReason::MaxCardFarmingTime => {
                tracing::info!(app_id = done.app_id, name = %done.name, "card farming: max card farming time cap reached");
            }
            CompletedFarmReason::MaxPlaytime => {
                tracing::info!(app_id = done.app_id, name = %done.name, "card farming: max playtime cap reached");
            }
        }
        if let Err(e) = queue::remove(app_handle, steam_id, done.app_id).await {
            tracing::warn!(app_id = done.app_id, error = %e.code(), "card farming: failed to remove finished game from queue");
        }
        // See `CardFarmingManager::start`'s identical prune - without this, a cap-based stop whose
        // game still has real drops remaining would reappear in the next `active`/`queue`-both-empty
        // refetch and get pushed into `completed` a second time.
        queued_app_ids.remove(&done.app_id);
        state.lock().await.completed.push(CompletedFarm {
            app_id: done.app_id,
            name: done.name,
            remaining: done.remaining,
            reason,
        });
    }
    finished_any
}

/// Replaces card farming's own owner claim with exactly `active` - also how the cycle releases its
/// claim at the end (`active: &[]`), so this is the only place `run_cycle` talks to `idling`. The
/// registry unions this with every other owner's claim before announcing, so this can never drop a
/// game manual idling/auto-idle/achievement-unlocker still wants.
async fn announce_idle_set(
    app_handle: &AppHandle,
    account: GamesAccount,
    active: &[FarmingProgress],
) -> AppResult<()> {
    let agent_manager = app_handle.state::<AgentManager>();
    let idling_manager = app_handle.state::<IdlingManager>();
    let claims = app_handle.state::<idling::claims::IdleClaimsRegistry>();
    let targets = active
        .iter()
        .map(|p| IdleTarget {
            app_id: p.app_id,
            name: p.name.clone(),
        })
        .collect();
    claims
        .replace_owner_claim(
            app_handle,
            agent_manager,
            idling_manager,
            account,
            idling::claims::OWNER_CARD_FARMING,
            targets,
        )
        .await
        .map(|_| ())
}

async fn emit_state(app_handle: &AppHandle, steam_id: &str, state: &Arc<Mutex<FarmingState>>) {
    let snapshot = state.lock().await.clone();
    let _ = app_handle.emit(
        FARMING_STATE_EVENT,
        serde_json::json!({ "steamId": steam_id, "state": snapshot }),
    );
}

/// Once the queue is genuinely empty (see `run_cycle`'s `queue_genuinely_empty`), starts whatever
/// `settings.next_task` names, if `next_task_checkbox` is on: `"achievementUnlocker"` or
/// `"autoIdle"` (`auto_idle::commands::start_auto_idle_games`) - mirrors
/// `achievement_unlocker::manager::maybe_start_next_task` exactly, chaining in the other direction.
/// Starts achievement unlocking with `max_concurrent_games: 1` - the gamer-tier
/// multi-concurrent-games setting is a frontend-resolved value normally passed in by the caller
/// (see `start_achievement_unlocker`'s own doc comment), which isn't available to this
/// automatically-triggered chain, so it conservatively starts single-game rather than guessing at
/// a tier this module has no way to check.
///
/// A plain `fn` returning a boxed trait object, not `async fn` - see
/// `achievement_unlocker::manager::maybe_start_next_task`'s matching doc comment for why this pair
/// being mutually recursive across modules needs this rather than an inferred `impl Future`.
fn maybe_start_next_task<'a>(
    app_handle: &'a AppHandle,
    account: &'a GamesAccount,
    steam_id: &'a str,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + 'a>> {
    Box::pin(async move {
        let farming_settings = match settings::get(app_handle, steam_id).await {
            Ok(s) => s,
            Err(_) => return,
        };
        if !farming_settings.next_task_checkbox {
            return;
        }

        match farming_settings.next_task.as_deref() {
            Some("achievementUnlocker") => {
                let agent_manager = app_handle.state::<AgentManager>();
                let unlocker_manager =
                    app_handle.state::<achievement_unlocker::AchievementUnlockerManager>();
                match achievement_unlocker::commands::start_achievement_unlocker(
                    app_handle.clone(),
                    agent_manager,
                    unlocker_manager,
                    account.clone(),
                    1,
                )
                .await
                {
                    Ok(_) => {
                        tracing::info!(
                            steam_id,
                            "card farming: queue empty, starting achievement unlocker next task"
                        )
                    }
                    Err(e) => {
                        tracing::warn!(steam_id, error = %e.code(), "card farming: failed to start next task (achievement unlocker)")
                    }
                }
            }
            Some("autoIdle") => {
                let agent_manager = app_handle.state::<AgentManager>();
                let idling_manager = app_handle.state::<IdlingManager>();
                let claims = app_handle.state::<idling::claims::IdleClaimsRegistry>();
                let auto_stop = app_handle.state::<idling::auto_stop::IdleAutoStopRegistry>();
                match auto_idle::commands::start_auto_idle_games(
                    app_handle.clone(),
                    agent_manager,
                    idling_manager,
                    claims,
                    auto_stop,
                    account.clone(),
                )
                .await
                {
                    Ok(_) => {
                        tracing::info!(
                            steam_id,
                            "card farming: queue empty, starting auto-idle next task"
                        )
                    }
                    Err(e) => {
                        tracing::warn!(steam_id, error = %e.code(), "card farming: failed to start next task (auto-idle)")
                    }
                }
            }
            _ => {}
        }
    })
}

/// The cycle itself: backfill the active set from the queue (up to [`MAX_CONCURRENT_FARMING`]),
/// announce it to `idling` if it changed, wait out one poll interval, poll every active game's
/// remaining count concurrently, drop finished games and re-announce immediately if any did, repeat
/// - refetching the drops list once both `active` and `queue` are empty in case a still-queued game
/// (`queued_app_ids`) picked up new drops mid-session, and stopping for good once that filtered
/// refetch also comes back empty.
///
/// Reached the bottom either because there's genuinely nothing left to farm or because [`stop`] set
/// `stopped` - both converge on the same cleanup below, which is safe to run twice (`stop` awaits
/// this very task before returning, so there's no concurrent double-run, but `set_idle_games([])`/
/// removing an already-removed map entry are idempotent regardless).
async fn run_cycle(
    app_handle: AppHandle,
    steam_id: String,
    account: GamesAccount,
    cookies: SteamCookies,
    state: Arc<Mutex<FarmingState>>,
    stopped: Arc<AtomicBool>,
    mut queued_app_ids: HashSet<u32>,
) {
    // Only set at the one break site below where the refetch itself comes back with nothing left
    // to farm - stays `false` for every other way this loop can end (a manual `stop`, mid-wait
    // `stopped` firing, or a refetch error), so `maybe_start_next_task` only ever chains on a
    // genuine finish, mirroring `achievement_unlocker::manager::run_loop`'s `EndReason::QueueEmpty`
    // check.
    let mut queue_genuinely_empty = false;

    while !stopped.load(Ordering::SeqCst) {
        let playtime_by_app_id = playtime_lookup(&app_handle, &steam_id);
        let added = {
            let mut s = state.lock().await;
            backfill_active(&mut s, &playtime_by_app_id)
        };

        let active_empty = state.lock().await.active.is_empty();
        if active_empty {
            match fetch_queued_games(&app_handle, &steam_id, &cookies, &queued_app_ids).await {
                Ok((games, excluded)) => {
                    if !excluded.is_empty() {
                        // Same prune as `CardFarmingManager::start` - this refetch reuses
                        // `queued_app_ids` to filter the scraper's response, so an id excluded just
                        // now must come out before the next iteration reaches this branch again,
                        // or it would be rediscovered and duplicated in `completed` forever.
                        for excluded_game in &excluded {
                            queued_app_ids.remove(&excluded_game.app_id);
                        }
                        state.lock().await.completed.extend(excluded);
                    }
                    if games.is_empty() {
                        queue_genuinely_empty = true;
                        break;
                    }
                    tracing::info!(
                        steam_id,
                        count = games.len(),
                        "card farming: refetched, found more queued games with drops"
                    );
                    state.lock().await.queue = games;
                    continue;
                }
                Err(e) => {
                    tracing::warn!(
                        steam_id,
                        error = %e.code(),
                        "card farming: failed to refetch games with drops, ending cycle"
                    );
                    break;
                }
            }
        }

        if added {
            let active = state.lock().await.active.clone();
            if let Err(e) = announce_idle_set(&app_handle, account.clone(), &active).await {
                tracing::warn!(steam_id, error = %e.code(), "card farming: failed to update the idling set");
            }
            tracing::info!(
                steam_id,
                count = active.len(),
                "card farming: idling set updated"
            );
            emit_state(&app_handle, &steam_id, &state).await;
        }

        if wait_ticking(DROPS_POLL_INTERVAL, &stopped).await {
            break;
        }

        let caps = settings::get_caps(&app_handle, &steam_id).await.unwrap_or_else(|e| {
            tracing::warn!(steam_id, error = %e.code(), "card farming: failed to read auto-stop caps, treating as uncapped this poll");
            FarmingCaps::default()
        });
        let finished = poll_active(
            &app_handle,
            &state,
            &steam_id,
            &cookies,
            &caps,
            &mut queued_app_ids,
        )
        .await;
        emit_state(&app_handle, &steam_id, &state).await;

        if finished {
            let active = state.lock().await.active.clone();
            if let Err(e) = announce_idle_set(&app_handle, account.clone(), &active).await {
                tracing::warn!(steam_id, error = %e.code(), "card farming: failed to update the idling set");
            }
        }
    }

    let _ = announce_idle_set(&app_handle, account.clone(), &[]).await;
    {
        let mut s = state.lock().await;
        s.is_farming = false;
        s.active.clear();
    }
    emit_state(&app_handle, &steam_id, &state).await;

    if queue_genuinely_empty {
        maybe_start_next_task(&app_handle, &account, &steam_id).await;
    }

    app_handle
        .state::<CardFarmingManager>()
        .remove(&steam_id)
        .await;
    tracing::info!(steam_id, "card farming: cycle ended");
}

#[cfg(test)]
mod tests {
    use super::*;

    // Most of this module's logic (the actual cycle: idle, poll `steamcommunity.com`, advance)
    // isn't unit-testable without network access or introducing a scraper trait purely for mocking.
    // `backfill_active` is the one piece of non-trivial logic that's both network-free and worth
    // locking down here.

    fn game(app_id: u32, remaining: u32) -> GameWithDrops {
        GameWithDrops {
            app_id,
            name: format!("Game {app_id}"),
            remaining,
            playtime_hours: 0.0,
        }
    }

    #[test]
    fn sort_by_drop_order_highest_first_orders_by_descending_remaining() {
        let mut games = vec![game(1, 3), game(2, 10), game(3, 1)];
        sort_by_drop_order(&mut games, settings::DropSortOrder::HighestFirst);
        assert_eq!(
            games.iter().map(|g| g.app_id).collect::<Vec<_>>(),
            vec![2, 1, 3]
        );
    }

    #[test]
    fn sort_by_drop_order_lowest_first_orders_by_ascending_remaining() {
        let mut games = vec![game(1, 3), game(2, 10), game(3, 1)];
        sort_by_drop_order(&mut games, settings::DropSortOrder::LowestFirst);
        assert_eq!(
            games.iter().map(|g| g.app_id).collect::<Vec<_>>(),
            vec![3, 1, 2]
        );
    }

    #[test]
    fn backfill_fills_up_to_the_concurrent_cap_and_leaves_the_rest_queued() {
        let mut farming = FarmingState {
            queue: (0..40).map(|i| game(i, 1)).collect(),
            ..Default::default()
        };

        let added = backfill_active(&mut farming, &HashMap::new());

        assert!(added);
        assert_eq!(farming.active.len(), MAX_CONCURRENT_FARMING);
        assert_eq!(farming.queue.len(), 40 - MAX_CONCURRENT_FARMING);
    }

    #[test]
    fn backfill_is_a_no_op_and_reports_unchanged_when_already_full() {
        let mut farming = FarmingState {
            active: (0..MAX_CONCURRENT_FARMING as u32)
                .map(|i| FarmingProgress {
                    app_id: i,
                    name: format!("Game {i}"),
                    initial_remaining: 1,
                    remaining: 1,
                    playtime_hours: 0.0,
                    started_at: Instant::now(),
                    baseline_playtime_minutes: 0,
                })
                .collect(),
            queue: vec![game(999, 1)],
            ..Default::default()
        };

        let added = backfill_active(&mut farming, &HashMap::new());

        assert!(!added);
        assert_eq!(farming.active.len(), MAX_CONCURRENT_FARMING);
        assert_eq!(farming.queue.len(), 1);
    }

    #[test]
    fn backfill_reports_unchanged_when_the_queue_is_already_empty() {
        let mut farming = FarmingState::default();
        assert!(!backfill_active(&mut farming, &HashMap::new()));
    }

    fn progress(
        app_id: u32,
        initial_remaining: u32,
        remaining: u32,
        started_at: Instant,
    ) -> FarmingProgress {
        FarmingProgress {
            app_id,
            name: format!("Game {app_id}"),
            initial_remaining,
            remaining,
            playtime_hours: 0.0,
            started_at,
            baseline_playtime_minutes: 0,
        }
    }

    #[test]
    fn is_capped_none_when_neither_cap_is_set() {
        let p = progress(440, 5, 3, Instant::now());
        assert!(is_capped(&p, &FarmingCaps::default()).is_none());
    }

    #[test]
    fn is_capped_reports_max_card_drops_reached() {
        let p = progress(440, 5, 2, Instant::now()); // 3 drops farmed so far
        let caps = FarmingCaps {
            per_game_max_card_drops: HashMap::from([(440, 3)]),
            ..Default::default()
        };
        assert!(matches!(
            is_capped(&p, &caps),
            Some(CompletedFarmReason::MaxCardDrops)
        ));
    }

    #[test]
    fn is_capped_not_reached_while_under_the_max_card_drops() {
        let p = progress(440, 5, 4, Instant::now()); // only 1 drop farmed so far
        let caps = FarmingCaps {
            per_game_max_card_drops: HashMap::from([(440, 3)]),
            ..Default::default()
        };
        assert!(is_capped(&p, &caps).is_none());
    }

    #[test]
    fn is_capped_reports_max_card_farming_time_reached_via_per_game_cap() {
        let p = progress(440, 5, 5, Instant::now() - Duration::from_secs(120));
        let caps = FarmingCaps {
            per_game_max_card_farming_time: HashMap::from([(440, 1)]), // 1 minute
            ..Default::default()
        };
        assert!(matches!(
            is_capped(&p, &caps),
            Some(CompletedFarmReason::MaxCardFarmingTime)
        ));
    }

    #[test]
    fn is_capped_per_game_max_card_farming_time_wins_over_global() {
        // Per-game cap (99 minutes, not yet elapsed) wins even though the global value (1 minute)
        // has - a specific override always takes precedence over the account-wide blanket value.
        let p = progress(440, 5, 5, Instant::now() - Duration::from_secs(120));
        let caps = FarmingCaps {
            global_max_card_farming_time: 1,
            per_game_max_card_farming_time: HashMap::from([(440, 99)]),
            ..Default::default()
        };
        assert!(is_capped(&p, &caps).is_none());
    }

    #[test]
    fn is_capped_global_used_when_per_game_is_unset() {
        let p = progress(440, 5, 5, Instant::now() - Duration::from_secs(120));
        let caps = FarmingCaps {
            global_max_card_farming_time: 1,
            ..Default::default()
        };
        assert!(matches!(
            is_capped(&p, &caps),
            Some(CompletedFarmReason::MaxCardFarmingTime)
        ));
    }

    #[test]
    fn is_capped_not_reached_before_the_max_card_farming_time_elapses() {
        let p = progress(440, 5, 5, Instant::now());
        let caps = FarmingCaps {
            per_game_max_card_farming_time: HashMap::from([(440, 30)]),
            ..Default::default()
        };
        assert!(is_capped(&p, &caps).is_none());
    }
}
