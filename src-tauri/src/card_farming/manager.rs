//! The farming-cycle background task. Every outer-loop iteration: re-scrape the account's
//! games-with-drops list, scope it to the whitelist when non-empty, filter through blacklist/skip
//! settings, classify the survivors into ready/accumulating, pick exactly one phase (never both -
//! see `mod.rs`'s module doc comment), run the shared restart-cycle helper against that phase's
//! target(s), then repeat. Calls `idling::claims::IdleClaimsRegistry::replace_owner_claim` (owner
//! `OWNER_CARD_FARMING`) for the actual idling mechanics - not `idling::commands::set_idle_games`
//! directly, since that would full-replace the real announced set and stomp whatever manual/
//! auto-idle/achievement-unlocker idling is also currently claimed (see `idling::claims`'s module
//! doc comment). This module owns no process/spawn logic of its own.

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::{Mutex, Notify};
use tokio::task::JoinHandle;

use crate::achievement_unlocker;
use crate::async_utils::wait_ticking;
use crate::auto_idle;
use crate::error::{AppError, AppResult};
use crate::games::{self, commands::GamesAccount};
use crate::idling::{self, IdleTarget, IdlingManager};
use crate::steam_agent::AgentManager;
use crate::steam_community::credentials;

use super::refund_window;
use super::settings;
use super::whitelist;
use super::{
    blacklist, scraper, CompletedFarm, CompletedFarmReason, FarmingProgress, FarmingState,
    GameWithDrops, Phase, SteamCookies,
};
use super::FARMING_STATE_EVENT;

/// Mirrors `idling`'s own concurrent-games cap (a real Steam protocol limit - see that module's doc
/// comment on `MAX_CONCURRENT_GAMES`), defined again here (rather than reaching into `idling`'s
/// private internals) so this module's own active-set bookkeeping stays consistent with what the
/// idling claims registry will actually accept.
const MAX_CONCURRENT_FARMING: usize = 32;

/// How long the restart-cycle idles its target(s) before the first stop of each iteration.
const FULL_IDLE_DURATION: Duration = Duration::from_secs(5 * 60);
/// How long the restart-cycle pauses between the main idle window and the individual sweep.
const MICRO_PAUSE: Duration = Duration::from_secs(5);
/// How long each target gets idled, alone, during the restart-cycle's individual sweep.
const MICRO_IDLE_DURATION: Duration = Duration::from_secs(5);

/// One owned-games-cache entry's worth of data this module's checks care about - bundles real
/// playtime (skip-settings, refund-window playtime threshold) and purchase recency (refund-window
/// date threshold) so [`resolve_candidates`] only needs one cache read/lookup per game instead of a
/// separate one per check.
#[derive(Debug, Clone, Copy, Default)]
struct CachedGameInfo {
    playtime_forever_minutes: u64,
    last_refund_eligible_purchase_unix_seconds: Option<i64>,
}

/// Best-effort `app_id -> `[`CachedGameInfo`]` lookup from the owned-games cache. A read failure
/// degrades to an empty map (every game reads as "nothing known") rather than failing the caller
/// outright.
fn owned_game_cache_lookup(app_handle: &AppHandle, steam_id: &str) -> HashMap<u32, CachedGameInfo> {
    games::commands::get_owned_games_cache(app_handle.clone(), steam_id.to_string())
        .unwrap_or_default()
        .into_iter()
        .map(|g| {
            (
                g.app_id,
                CachedGameInfo {
                    playtime_forever_minutes: g.playtime_forever_minutes,
                    last_refund_eligible_purchase_unix_seconds: g
                        .last_refund_eligible_purchase_unix_seconds,
                },
            )
        })
        .collect()
}

/// Pure filter check, split out so it's unit-testable without network/settings-file I/O - checks
/// `skip_no_playtime`/`farm_unplayed_only`/`skip_refundable_games` against a game's cached real
/// playtime/purchase data. Returns the specific reason it should be excluded, or `None` if it passes
/// every check.
fn filter_reason(
    cached: CachedGameInfo,
    farming_settings: &settings::CardFarmingSettings,
    now_unix_seconds: i64,
) -> Option<CompletedFarmReason> {
    if farming_settings.skip_no_playtime && cached.playtime_forever_minutes == 0 {
        return Some(CompletedFarmReason::SkippedUnplayed);
    }
    if farming_settings.farm_unplayed_only && cached.playtime_forever_minutes > 0 {
        return Some(CompletedFarmReason::SkippedPlayed);
    }
    if farming_settings.skip_refundable_games
        && refund_window::farmable_at_if_in_refund_window(
            cached.last_refund_eligible_purchase_unix_seconds,
            cached.playtime_forever_minutes,
            now_unix_seconds,
        )
        .is_some()
    {
        return Some(CompletedFarmReason::RefundWindow);
    }
    None
}

struct ResolvedCandidates {
    ready: Vec<GameWithDrops>,
    accumulating: Vec<GameWithDrops>,
}

/// Scrapes the current games-with-drops list, scopes it to the whitelist when non-empty, filters
/// through blacklist/`excluded_app_ids`/skip-settings, and classifies the survivors into
/// ready/accumulating. Read-only against `progress` (every game this session currently has
/// `active`) - only consulted to decide *which* completion reason applies, never mutated here;
/// `run_cycle` owns all `progress` mutation in one place after this returns.
///
/// A game can drop out of eligibility two distinct ways, reported differently:
/// - **Not found in the fresh scrape at all** - its remaining drops hit zero. `DropsExhausted` if
///   `progress` shows it was actively being farmed (a genuine finish), `NoDropsRemaining` otherwise
///   (only reachable for a whitelist member that turns out to have never had real drops - the
///   general pool is built directly from the scrape, so a zero-drops game can never enter it, and
///   therefore never enters `progress`, in the first place).
/// - **Found, but excluded by blacklist/`excluded_app_ids`/a skip setting** - only reported (with
///   the precise reason, and pruned from the whitelist) when the game is a current whitelist
///   member; a general-pool game hitting this case (only possible if a setting changed mid-session,
///   since the general pool is pre-filtered before a game ever enters `progress`) is dropped
///   silently - filters exclude quietly everywhere except an explicit whitelist membership, which
///   warrants an explanation since the user opted it in deliberately.
async fn resolve_candidates(
    app_handle: &AppHandle,
    steam_id: &str,
    cookies: &SteamCookies,
    farming_settings: &settings::CardFarmingSettings,
    progress: &HashMap<u32, FarmingProgress>,
    excluded_app_ids: &HashSet<u32>,
    completed: &mut Vec<CompletedFarm>,
) -> AppResult<ResolvedCandidates> {
    let games = scraper::get_games_with_drops(steam_id, cookies).await?;
    let games_by_app_id: HashMap<u32, GameWithDrops> =
        games.into_iter().map(|g| (g.app_id, g)).collect();

    let blacklisted: HashSet<u32> = blacklist::read(app_handle, steam_id)
        .await?
        .into_iter()
        .map(|entry| entry.app_id)
        .collect();
    let whitelist_entries = whitelist::read(app_handle, steam_id).await?;
    let game_cache = owned_game_cache_lookup(app_handle, steam_id);
    let now = chrono::Utc::now().timestamp();

    let mut ready = Vec::new();
    let mut accumulating = Vec::new();
    let classify = |game: GameWithDrops, ready: &mut Vec<GameWithDrops>, accumulating: &mut Vec<GameWithDrops>| {
        if game.playtime_hours >= farming_settings.hours_until_farmable as f32 {
            ready.push(game);
        } else {
            accumulating.push(game);
        }
    };

    if !whitelist_entries.is_empty() {
        for entry in &whitelist_entries {
            if excluded_app_ids.contains(&entry.app_id) {
                continue;
            }
            let Some(game) = games_by_app_id.get(&entry.app_id).cloned() else {
                let reason = if progress.contains_key(&entry.app_id) {
                    CompletedFarmReason::DropsExhausted
                } else {
                    CompletedFarmReason::NoDropsRemaining
                };
                prune_whitelist_member(
                    app_handle,
                    steam_id,
                    entry.app_id,
                    entry.name.clone(),
                    0,
                    reason,
                    None,
                    completed,
                )
                .await;
                continue;
            };
            if blacklisted.contains(&game.app_id) {
                // Defensive only - the browse tab's mutually-exclusive toggle shouldn't let a game
                // land on both lists, but if it somehow does, it must not farm. No completion
                // report - blacklisting already has its own, separate semantics.
                if let Err(e) = whitelist::remove(app_handle, steam_id, game.app_id).await {
                    tracing::warn!(app_id = game.app_id, error = %e.code(), "card farming: failed to remove blacklisted game from whitelist");
                }
                continue;
            }
            let cached = game_cache.get(&game.app_id).copied().unwrap_or_default();
            if let Some(reason) = filter_reason(cached, farming_settings, now) {
                let farmable_at = if matches!(reason, CompletedFarmReason::RefundWindow) {
                    refund_window::farmable_at_if_in_refund_window(
                        cached.last_refund_eligible_purchase_unix_seconds,
                        cached.playtime_forever_minutes,
                        now,
                    )
                } else {
                    None
                };
                prune_whitelist_member(
                    app_handle,
                    steam_id,
                    game.app_id,
                    game.name.clone(),
                    game.remaining,
                    reason,
                    farmable_at,
                    completed,
                )
                .await;
                continue;
            }
            classify(game, &mut ready, &mut accumulating);
        }
    } else {
        for (app_id, game) in &games_by_app_id {
            if excluded_app_ids.contains(app_id) || blacklisted.contains(app_id) {
                continue;
            }
            let cached = game_cache.get(app_id).copied().unwrap_or_default();
            if filter_reason(cached, farming_settings, now).is_some() {
                continue;
            }
            classify(game.clone(), &mut ready, &mut accumulating);
        }

        // Anything still tracked in `progress` that the loop above didn't re-admit either
        // genuinely finished (not in the raw scrape at all) or was excluded by a filter that
        // changed mid-session (still in the raw scrape, just no longer eligible) - only the former
        // is reported, see this fn's doc comment.
        let still_eligible: HashSet<u32> = ready
            .iter()
            .chain(accumulating.iter())
            .map(|g| g.app_id)
            .collect();
        for (app_id, prog) in progress {
            if still_eligible.contains(app_id) || games_by_app_id.contains_key(app_id) {
                continue;
            }
            tracing::info!(app_id, name = %prog.name, "card farming: drops exhausted");
            completed.push(CompletedFarm {
                app_id: *app_id,
                name: prog.name.clone(),
                remaining: 0,
                reason: CompletedFarmReason::DropsExhausted,
                farmable_at: None,
            });
        }
    }

    Ok(ResolvedCandidates { ready, accumulating })
}

#[allow(clippy::too_many_arguments)]
async fn prune_whitelist_member(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    name: String,
    remaining: u32,
    reason: CompletedFarmReason,
    farmable_at: Option<i64>,
    completed: &mut Vec<CompletedFarm>,
) {
    if let Err(e) = whitelist::remove(app_handle, steam_id, app_id).await {
        tracing::warn!(app_id, error = %e.code(), "card farming: failed to remove game from whitelist");
    }
    tracing::info!(app_id, name = %name, reason = ?reason, "card farming: removed game from whitelist");
    completed.push(CompletedFarm {
        app_id,
        name,
        remaining,
        reason,
        farmable_at,
    });
}

/// Picks exactly one phase from `candidates` and its target(s) - pure and unit-testable, no
/// network/lock access. `None` means nothing is eligible at all (the cycle should end).
fn select_phase(
    candidates: &ResolvedCandidates,
    allow_multi_game_farming: bool,
) -> Option<(Phase, Vec<GameWithDrops>)> {
    if !candidates.ready.is_empty() {
        if allow_multi_game_farming {
            let mut ready = candidates.ready.clone();
            // Fewest remaining drops first - same tie-break the solo case uses below, now
            // deciding who gets priority for the limited concurrent-farm slots when there are
            // more than MAX_CONCURRENT_FARMING games ready at once. Capping here (not just
            // relying on `idling::claims`'s own downstream cap) matters because this list also
            // drives `state.active`/`progress` - without it, games beyond the cap would show as
            // "farming" while actually only getting a few seconds of real idle time per cycle
            // (during the restart-cycle's individual sweep), never the full main window.
            ready.sort_by_key(|g| g.remaining);
            ready.truncate(MAX_CONCURRENT_FARMING);
            Some((Phase::ReadyFarm, ready))
        } else {
            let target = candidates
                .ready
                .iter()
                .min_by_key(|g| g.remaining)?
                .clone();
            Some((Phase::ReadyFarm, vec![target]))
        }
    } else if !candidates.accumulating.is_empty() {
        let mut accumulating = candidates.accumulating.clone();
        // Highest playtime_hours first - closest to `hours_until_farmable` gets priority for the
        // limited slots when there are more than MAX_CONCURRENT_FARMING accumulating at once.
        accumulating.sort_by(|a, b| {
            b.playtime_hours
                .partial_cmp(&a.playtime_hours)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        accumulating.truncate(MAX_CONCURRENT_FARMING);
        Some((Phase::BulkIdle, accumulating))
    } else {
        None
    }
}

enum CycleOutcome {
    Completed,
    Stopped,
    Woken,
}

async fn race_wait(duration: Duration, stopped: &AtomicBool, wake: &Notify) -> Option<CycleOutcome> {
    tokio::select! {
        stop_requested = wait_ticking(duration, stopped) => {
            stop_requested.then_some(CycleOutcome::Stopped)
        }
        _ = wake.notified() => Some(CycleOutcome::Woken),
    }
}

async fn announce_idle_set(
    app_handle: &AppHandle,
    account: GamesAccount,
    targets: &[IdleTarget],
) -> AppResult<()> {
    let agent_manager = app_handle.state::<AgentManager>();
    let idling_manager = app_handle.state::<IdlingManager>();
    let claims = app_handle.state::<idling::claims::IdleClaimsRegistry>();
    claims
        .replace_owner_claim(
            app_handle,
            agent_manager,
            idling_manager,
            account,
            idling::claims::OWNER_CARD_FARMING,
            targets.to_vec(),
        )
        .await
        .map(|_| ())
}

/// Runs one full stop/pause/restart micro-cycle against `targets` - the same sequence whether
/// `targets.len()` is 1 (a solo ready-farm pick) or more (a bulk-idle batch, or a multi-game
/// ready-farm batch when `allow_multi_game_farming` is on): idle everything together for
/// [`FULL_IDLE_DURATION`], stop, pause [`MICRO_PAUSE`], then sweep every target individually
/// ([`MICRO_IDLE_DURATION`] each, stopped between each - exactly one target physically idling at any
/// instant during this step) before returning control to the caller for a fresh
/// re-scrape/reclassify. Every stop and start here is a real `IdleClaimsRegistry::
/// replace_owner_claim` call - cheap for agent mode (a single local IPC round trip to the daemon,
/// no Steam-side rate limit in this codebase) and for CLI mode (`IdlingManager::set_games` diffs
/// kill/spawn per process, fast even for a full batch) alike; the real wall-clock cost of the
/// individual sweep is the deliberate per-target dwell time itself, identical for both modes.
async fn run_restart_cycle(
    app_handle: &AppHandle,
    account: &GamesAccount,
    targets: &[IdleTarget],
    stopped: &AtomicBool,
    wake: &Notify,
) -> CycleOutcome {
    if targets.is_empty() {
        return CycleOutcome::Completed;
    }

    if let Err(e) = announce_idle_set(app_handle, account.clone(), targets).await {
        tracing::warn!(error = %e.code(), "card farming: failed to start idling this cycle's targets");
    }
    if let Some(outcome) = race_wait(FULL_IDLE_DURATION, stopped, wake).await {
        let _ = announce_idle_set(app_handle, account.clone(), &[]).await;
        return outcome;
    }
    let _ = announce_idle_set(app_handle, account.clone(), &[]).await;

    if let Some(outcome) = race_wait(MICRO_PAUSE, stopped, wake).await {
        return outcome;
    }

    for target in targets {
        if let Err(e) = announce_idle_set(
            app_handle,
            account.clone(),
            std::slice::from_ref(target),
        )
        .await
        {
            tracing::warn!(app_id = target.app_id, error = %e.code(), "card farming: failed to start idling during the individual sweep");
        }
        if let Some(outcome) = race_wait(MICRO_IDLE_DURATION, stopped, wake).await {
            let _ = announce_idle_set(app_handle, account.clone(), &[]).await;
            return outcome;
        }
        let _ = announce_idle_set(app_handle, account.clone(), &[]).await;
    }

    CycleOutcome::Completed
}

async fn emit_state(app_handle: &AppHandle, steam_id: &str, state: &Arc<Mutex<FarmingState>>) {
    let snapshot = state.lock().await.clone();
    let _ = app_handle.emit(
        FARMING_STATE_EVENT,
        serde_json::json!({ "steamId": steam_id, "state": snapshot }),
    );
}

/// Once nothing is eligible at all (see `run_cycle`'s `queue_genuinely_empty`), starts whatever
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
                            "card farming: nothing left eligible, starting achievement unlocker next task"
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
                            "card farming: nothing left eligible, starting auto-idle next task"
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

struct FarmingSession {
    handle: JoinHandle<()>,
    stopped: Arc<AtomicBool>,
    state: Arc<Mutex<FarmingState>>,
    /// Session-scoped manual exclusions (Idling page's per-game "stop" toggle) - see
    /// [`CardFarmingManager::remove_active_game`]'s doc comment. Checked by [`resolve_candidates`]
    /// alongside the persisted blacklist, but never persisted itself and never survives past this
    /// session.
    excluded_app_ids: Arc<Mutex<HashSet<u32>>>,
    /// Lets [`CardFarmingManager::remove_active_game`] interrupt the current restart-cycle wait
    /// immediately instead of leaving a manually-stopped game showing as idling for up to the rest
    /// of that wait.
    wake: Arc<Notify>,
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
    /// anything. Always spawns [`run_cycle`], even if nothing turns out to be eligible - only the
    /// spawned task ever emits [`FARMING_STATE_EVENT`], so a would-be early return here would leave
    /// the "nothing to farm" outcome with no way to ever reach the frontend.
    pub async fn start(
        &self,
        app_handle: &AppHandle,
        steam_id: String,
        account: GamesAccount,
        cookies: SteamCookies,
    ) -> AppResult<FarmingState> {
        {
            let sessions = self.sessions.lock().await;
            if let Some(session) = sessions.get(&steam_id) {
                return Ok(session.state.lock().await.clone());
            }
        }

        tracing::info!(steam_id, "card farming: session started");

        let state = Arc::new(Mutex::new(FarmingState {
            is_farming: true,
            ..Default::default()
        }));
        let stopped = Arc::new(AtomicBool::new(false));
        let excluded_app_ids = Arc::new(Mutex::new(HashSet::new()));
        let wake = Arc::new(Notify::new());

        let handle = tokio::spawn(run_cycle(
            app_handle.clone(),
            steam_id.clone(),
            account,
            cookies,
            state.clone(),
            stopped.clone(),
            excluded_app_ids.clone(),
            wake.clone(),
        ));

        let snapshot = state.lock().await.clone();
        self.sessions.lock().await.insert(
            steam_id,
            FarmingSession {
                handle,
                stopped,
                state,
                excluded_app_ids,
                wake,
            },
        );
        Ok(snapshot)
    }

    /// Stops `steam_id`'s farming cycle if one is running - idempotent (a no-op if nothing is
    /// tracked). Sets a flag rather than aborting the task outright, so the task always reaches
    /// its own cleanup (stop idling, clear state) instead of being killed mid-`replace_owner_claim`
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

    /// Permanently excludes `app_id` from a running session for `steam_id` - the Idling page's
    /// per-card "stop" toggle already releases the idling claim itself via
    /// `idling::claims::IdleClaimsRegistry::release_app_id` (this session finds out its game
    /// stopped idling from that, not from here), but this manager tracks its own `active`/`queue`
    /// independently and would otherwise never learn a specific game was pulled out from under
    /// it - the next unrelated state change would silently resurrect it via the next
    /// `resolve_candidates`/`select_phase` pass. Deliberately doesn't add a [`CompletedFarm`] entry
    /// - a manual stop isn't "this game is done." Leaves the whitelist/blacklist untouched - a
    /// fresh session started later still considers this game. A no-op (`false`) if no session is
    /// running for `steam_id`, or the game isn't part of this session's `active`/`queue` at all.
    pub async fn remove_active_game(
        &self,
        app_handle: &AppHandle,
        steam_id: &str,
        app_id: u32,
    ) -> bool {
        let (excluded_app_ids, state, wake) = {
            let sessions = self.sessions.lock().await;
            let Some(session) = sessions.get(steam_id) else {
                return false;
            };
            (
                session.excluded_app_ids.clone(),
                session.state.clone(),
                session.wake.clone(),
            )
        };

        excluded_app_ids.lock().await.insert(app_id);

        let removed = {
            let mut s = state.lock().await;
            let before = s.active.len() + s.queue.len();
            s.active.retain(|p| p.app_id != app_id);
            s.queue.retain(|g| g.app_id != app_id);
            before != s.active.len() + s.queue.len()
        };

        if removed {
            tracing::info!(
                steam_id,
                app_id,
                "card farming: game removed from session (manually stopped via idling page)"
            );
            emit_state(app_handle, steam_id, &state).await;
            wake.notify_one();
        }
        removed
    }

    async fn remove(&self, steam_id: &str) {
        self.sessions.lock().await.remove(steam_id);
    }
}

/// The cycle itself: resolve this iteration's eligible pool, pick a phase, run the restart-cycle
/// against its target(s), repeat - ending once nothing is eligible at all, [`CardFarmingManager::
/// stop`] set `stopped`, or a mid-cycle Steam Community session expiry was confirmed (see
/// [`FarmingState::session_expired`]). All three converge on the same cleanup below, safe to run
/// once (`stop` awaits this very task before returning, so there's no concurrent double-run, but
/// `replace_owner_claim([])`/removing an already-removed session entry are idempotent regardless).
#[allow(clippy::too_many_arguments)]
async fn run_cycle(
    app_handle: AppHandle,
    steam_id: String,
    account: GamesAccount,
    cookies: SteamCookies,
    state: Arc<Mutex<FarmingState>>,
    stopped: Arc<AtomicBool>,
    excluded_app_ids: Arc<Mutex<HashSet<u32>>>,
    wake: Arc<Notify>,
) {
    // Session-scoped, survives across outer-loop iterations - see `FarmingProgress::active_since`'s
    // doc comment for why entries persist only while a game stays continuously selected as a
    // target, and `resolve_candidates`'s doc comment for how a dropped-out entry gets reconciled.
    let mut progress: HashMap<u32, FarmingProgress> = HashMap::new();
    // Only set at the one break site below where nothing is eligible at all - stays `false` for
    // every other way this loop can end (a manual stop, mid-wait `stopped` firing, or a resolve
    // error), so `maybe_start_next_task` only ever chains on a genuine "nothing left" finish.
    let mut queue_genuinely_empty = false;

    while !stopped.load(Ordering::SeqCst) {
        let farming_settings = settings::get(&app_handle, &steam_id).await.unwrap_or_default();
        let excluded_snapshot = excluded_app_ids.lock().await.clone();

        let mut new_completed = Vec::new();
        let candidates = match resolve_candidates(
            &app_handle,
            &steam_id,
            &cookies,
            &farming_settings,
            &progress,
            &excluded_snapshot,
            &mut new_completed,
        )
        .await
        {
            Ok(c) => c,
            Err(AppError::SteamCommunitySessionExpired(id)) => {
                let _ = credentials::clear(&id);
                let mut s = state.lock().await;
                s.session_expired = true;
                s.completed.extend(new_completed);
                drop(s);
                emit_state(&app_handle, &steam_id, &state).await;
                tracing::warn!(
                    steam_id,
                    "card farming: steam community session expired mid-cycle, stopping"
                );
                break;
            }
            Err(e) => {
                tracing::warn!(steam_id, error = %e.code(), "card farming: failed to resolve candidates, ending cycle");
                let mut s = state.lock().await;
                s.completed.extend(new_completed);
                drop(s);
                emit_state(&app_handle, &steam_id, &state).await;
                break;
            }
        };

        if !new_completed.is_empty() {
            let mut s = state.lock().await;
            s.completed.extend(new_completed);
            drop(s);
            emit_state(&app_handle, &steam_id, &state).await;
        }

        let Some((phase, targets)) =
            select_phase(&candidates, farming_settings.allow_multi_game_farming)
        else {
            queue_genuinely_empty = true;
            break;
        };

        let target_ids: HashSet<u32> = targets.iter().map(|g| g.app_id).collect();
        let queue_list: Vec<GameWithDrops> = candidates
            .ready
            .into_iter()
            .chain(candidates.accumulating)
            .filter(|g| !target_ids.contains(&g.app_id))
            .collect();

        // Only entries still selected as a target survive - see `FarmingProgress::active_since`'s
        // doc comment for why dropping to `queue` (even briefly) resets the clock, and why the
        // restart-cycle's own internal blips (below) never reach this point at all.
        progress.retain(|app_id, _| target_ids.contains(app_id));
        let now_ms = chrono::Utc::now().timestamp_millis();
        let mut active_progress = Vec::with_capacity(targets.len());
        for game in &targets {
            let entry = progress.entry(game.app_id).or_insert_with(|| FarmingProgress {
                app_id: game.app_id,
                name: game.name.clone(),
                initial_remaining: game.remaining,
                remaining: game.remaining,
                playtime_hours: game.playtime_hours,
                active_since: now_ms,
            });
            entry.remaining = game.remaining;
            entry.playtime_hours = game.playtime_hours;
            active_progress.push(entry.clone());
        }

        {
            let mut s = state.lock().await;
            s.phase = Some(phase);
            s.active = active_progress;
            s.queue = queue_list;
        }
        emit_state(&app_handle, &steam_id, &state).await;

        let idle_targets: Vec<IdleTarget> = targets
            .iter()
            .map(|g| IdleTarget {
                app_id: g.app_id,
                name: g.name.clone(),
            })
            .collect();

        match run_restart_cycle(&app_handle, &account, &idle_targets, &stopped, &wake).await {
            CycleOutcome::Stopped => break,
            CycleOutcome::Completed | CycleOutcome::Woken => continue,
        }
    }

    let _ = announce_idle_set(&app_handle, account.clone(), &[]).await;
    {
        let mut s = state.lock().await;
        s.is_farming = false;
        s.phase = None;
        s.active.clear();
        s.queue.clear();
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

    fn game(app_id: u32, remaining: u32, playtime_hours: f32) -> GameWithDrops {
        GameWithDrops {
            app_id,
            name: format!("Game {app_id}"),
            remaining,
            playtime_hours,
        }
    }

    #[test]
    fn select_phase_prefers_ready_farm_over_bulk_idle() {
        let candidates = ResolvedCandidates {
            ready: vec![game(1, 3, 5.0)],
            accumulating: vec![game(2, 5, 1.0)],
        };
        let (phase, targets) = select_phase(&candidates, false).unwrap();
        assert_eq!(phase, Phase::ReadyFarm);
        assert_eq!(targets.iter().map(|g| g.app_id).collect::<Vec<_>>(), vec![1]);
    }

    #[test]
    fn select_phase_solo_picks_fewest_remaining_first() {
        let candidates = ResolvedCandidates {
            ready: vec![game(1, 5, 5.0), game(2, 2, 5.0), game(3, 8, 5.0)],
            accumulating: vec![],
        };
        let (phase, targets) = select_phase(&candidates, false).unwrap();
        assert_eq!(phase, Phase::ReadyFarm);
        assert_eq!(targets.len(), 1);
        assert_eq!(targets[0].app_id, 2);
    }

    #[test]
    fn select_phase_multi_game_farming_targets_every_ready_game() {
        let candidates = ResolvedCandidates {
            ready: vec![game(1, 5, 5.0), game(2, 2, 5.0)],
            accumulating: vec![],
        };
        let (phase, targets) = select_phase(&candidates, true).unwrap();
        assert_eq!(phase, Phase::ReadyFarm);
        assert_eq!(targets.len(), 2);
    }

    #[test]
    fn select_phase_multi_game_farming_caps_at_max_concurrent_and_prioritizes_fewest_remaining() {
        // 40 ready games, remaining count equal to app_id (so app_id 0 has the fewest remaining,
        // app_id 39 the most) - only the 32 with the fewest remaining should be selected.
        let ready: Vec<GameWithDrops> = (0..40).map(|i| game(i, i, 5.0)).collect();
        let candidates = ResolvedCandidates {
            ready,
            accumulating: vec![],
        };
        let (phase, targets) = select_phase(&candidates, true).unwrap();
        assert_eq!(phase, Phase::ReadyFarm);
        assert_eq!(targets.len(), MAX_CONCURRENT_FARMING);
        assert!(targets.iter().any(|g| g.app_id == 0));
        assert!(targets.iter().any(|g| g.app_id == 31));
        assert!(!targets.iter().any(|g| g.app_id == 32));
        assert!(!targets.iter().any(|g| g.app_id == 39));
    }

    #[test]
    fn select_phase_bulk_idle_when_nothing_ready() {
        let candidates = ResolvedCandidates {
            ready: vec![],
            accumulating: vec![game(1, 5, 1.0), game(2, 5, 2.5)],
        };
        let (phase, targets) = select_phase(&candidates, false).unwrap();
        assert_eq!(phase, Phase::BulkIdle);
        assert_eq!(targets.len(), 2);
    }

    #[test]
    fn select_phase_bulk_idle_prioritizes_closest_to_threshold_when_over_cap() {
        let accumulating: Vec<GameWithDrops> =
            (0..40).map(|i| game(i, 1, i as f32 * 0.1)).collect();
        let candidates = ResolvedCandidates {
            ready: vec![],
            accumulating,
        };
        let (phase, targets) = select_phase(&candidates, false).unwrap();
        assert_eq!(phase, Phase::BulkIdle);
        assert_eq!(targets.len(), MAX_CONCURRENT_FARMING);
        // Highest playtime_hours (closest to threshold) must be included - id 39 has the highest,
        // id 0 the lowest and must be excluded once there are more than the cap.
        assert!(targets.iter().any(|g| g.app_id == 39));
        assert!(!targets.iter().any(|g| g.app_id == 0));
    }

    #[test]
    fn select_phase_none_when_nothing_eligible() {
        let candidates = ResolvedCandidates {
            ready: vec![],
            accumulating: vec![],
        };
        assert!(select_phase(&candidates, false).is_none());
    }

    fn cached(playtime_minutes: u64, purchase: Option<i64>) -> CachedGameInfo {
        CachedGameInfo {
            playtime_forever_minutes: playtime_minutes,
            last_refund_eligible_purchase_unix_seconds: purchase,
        }
    }

    fn settings_with(
        skip_no_playtime: bool,
        farm_unplayed_only: bool,
        skip_refundable_games: bool,
    ) -> settings::CardFarmingSettings {
        settings::CardFarmingSettings {
            skip_no_playtime,
            farm_unplayed_only,
            skip_refundable_games,
            ..Default::default()
        }
    }

    #[test]
    fn filter_reason_skips_unplayed_when_requested() {
        let s = settings_with(true, false, false);
        assert!(matches!(
            filter_reason(cached(0, None), &s, 0),
            Some(CompletedFarmReason::SkippedUnplayed)
        ));
    }

    #[test]
    fn filter_reason_skips_played_when_farm_unplayed_only() {
        let s = settings_with(false, true, false);
        assert!(matches!(
            filter_reason(cached(60, None), &s, 0),
            Some(CompletedFarmReason::SkippedPlayed)
        ));
    }

    #[test]
    fn filter_reason_none_when_no_filters_apply() {
        let s = settings_with(false, false, false);
        assert!(filter_reason(cached(0, None), &s, 0).is_none());
    }

    #[test]
    fn filter_reason_skips_refundable_when_inside_window() {
        let s = settings_with(false, false, true);
        let now = 1_000_000;
        assert!(matches!(
            filter_reason(cached(0, Some(now)), &s, now),
            Some(CompletedFarmReason::RefundWindow)
        ));
    }

    #[test]
    fn filter_reason_refund_window_ignored_when_setting_off() {
        let s = settings_with(false, false, false);
        let now = 1_000_000;
        assert!(filter_reason(cached(0, Some(now)), &s, now).is_none());
    }
}
