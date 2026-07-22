//! The unlock automation loop, combining the queue (`cache`), settings/max-unlocks (`settings`),
//! and per-game order (`order`) into a running background task. Structurally mirrors
//! `card_farming::manager`: a `Manager` type owns at most one session per account (keyed by
//! resolved SteamID64), `start`/`stop` are idempotent, and the actual work runs as a
//! `tokio::spawn`ed task the manager doesn't otherwise touch.
//!
//! **Two-phase passes**: each pass first scans the *entire* current queue for achievement data
//! concurrently (dropping games with nothing left to unlock as it goes), then - only once scanning
//! is fully done - unlocks the games found to have achievements remaining, also concurrently up to
//! `worker_count` workers. Looping back to a fresh `cache::read` after each pass picks up games
//! added to the queue mid-run. `worker_count` (1, or up to [`MAX_CONCURRENT_GAMES`] for gamer-tier
//! accounts with `multipleGames` on) is resolved by the frontend and passed in as
//! `max_concurrent_games` - this module just clamps it, tier gating lives at the frontend call site.
//!
//! **`max_concurrent_games` is re-read at the start of every pass, not just once at session start**
//! - stored as a shared [`AtomicU32`] that `commands::update_achievement_unlocker_concurrency` can
//! update live, so a session started under Gamer tier re-clamps to 1 on its *next* pass after a
//! downgrade instead of continuing to unlock multiple games indefinitely.
//!
//! **Idling is claimed for the whole active set, not per-game** - `set_game_idling` tracks which
//! active app ids currently want to be idled (only past their initial delay, not schedule-waiting)
//! in one shared map, and re-announces this session's entire set as one owner claim via
//! `idling::claims::IdleClaimsRegistry::replace_owner_claim` whenever it changes, so it reconciles
//! with card farming's and manual idling's own claims instead of stomping on them.

use std::cmp::Ordering as CmpOrdering;
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use std::time::Duration;

use chrono::Timelike;
use rand::Rng;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

use crate::achievements::{self, AchievementDto};
use crate::async_utils::wait_ticking;
use crate::auto_idle;
use crate::card_farming;
use crate::error::AppResult;
use crate::games::commands::GamesAccount;
use crate::idling::{self, IdleTarget, IdlingManager};
use crate::steam_agent::AgentManager;

use super::settings::ScheduleTime;
use super::{
    cache, order, settings, AchievementUnlockerEntry, AchievementUnlockerState, ActiveGameProgress,
    CompletedUnlock, CompletedUnlockReason, ScanProgress, UpcomingAchievement,
    ACHIEVEMENT_UNLOCKER_STATE_EVENT,
};

/// Mirrors `idling`'s own concurrent-games cap (see `card_farming::manager`'s identical constant
/// and doc comment for why it's redefined locally rather than reaching into `idling`'s internals).
pub const MAX_CONCURRENT_GAMES: u32 = 32;

/// Grace period before a worker starts unlocking its first game for the session - matches `main`'s
/// hardcoded 10s.
const INITIAL_DELAY: Duration = Duration::from_secs(10);

/// Wait between finishing one game and starting the next *when running single-game (worker_count
/// == 1) and the next game has no `delayBeforeFirstUnlock` of its own* - matches `main`'s
/// hardcoded 2 minutes. Skipped entirely in multi-game mode (each worker's games already overlap
/// in time, so there's no "switching" to pace) and skipped when the next game already has its own
/// configured delay (redundant otherwise).
const INTER_GAME_DELAY: Duration = Duration::from_secs(120);

const MAX_UNLOCK_ATTEMPTS: usize = 3;
const RETRY_BACKOFF: [Duration; 2] = [Duration::from_secs(2), Duration::from_secs(5)];

/// How many of the soonest-upcoming achievements to project in [`ActiveGameProgress::upcoming`] -
/// matches `main`'s `buildUpcomingQueue` default `limit`.
const UPCOMING_LIMIT: usize = 5;

struct UnlockerSession {
    handle: JoinHandle<()>,
    stopped: Arc<AtomicBool>,
    state: Arc<Mutex<AchievementUnlockerState>>,
    /// Live-updatable worker count - see this module's doc comment on why a session-start-only
    /// value isn't enough. Re-read (and re-clamped) at the top of every pass in [`run_loop`].
    max_concurrent_games: Arc<AtomicU32>,
    /// Shared with the spawned `run_loop` task so [`AchievementUnlockerManager::
    /// remove_active_game`] can immediately drop a game's idling claim and, via
    /// `excluded_app_ids`, permanently block it from being re-idled for the rest of this session -
    /// see that method's doc comment for the resurrection this closes.
    idling_apps: Arc<Mutex<HashMap<u32, String>>>,
    excluded_app_ids: Arc<Mutex<HashSet<u32>>>,
}

/// Tracks at most one unlocker session per account (keyed by resolved SteamID64, matching
/// `card_farming::CardFarmingManager`'s convention), each running as its own background task.
#[derive(Default)]
pub struct AchievementUnlockerManager {
    sessions: Mutex<HashMap<String, UnlockerSession>>,
}

impl AchievementUnlockerManager {
    pub fn new() -> Self {
        Self::default()
    }

    /// Starts an unlocker session for `steam_id` if one isn't already running - idempotent, same
    /// "a second call while one is already in flight just returns its current state" convention
    /// `card_farming::CardFarmingManager::start` already uses. Returns a default/not-running state
    /// (no task spawned) if the queue is currently empty.
    pub async fn start(
        &self,
        app_handle: &AppHandle,
        steam_id: String,
        account: GamesAccount,
        max_concurrent_games: u32,
    ) -> AppResult<AchievementUnlockerState> {
        {
            let sessions = self.sessions.lock().await;
            if let Some(session) = sessions.get(&steam_id) {
                return Ok(session.state.lock().await.clone());
            }
        }

        let queue = cache::read(app_handle, &steam_id).await?;
        if queue.is_empty() {
            return Ok(AchievementUnlockerState::default());
        }

        let worker_count = max_concurrent_games.clamp(1, MAX_CONCURRENT_GAMES);
        tracing::info!(
            steam_id,
            queue_len = queue.len(),
            worker_count,
            "achievement unlocker: session started"
        );
        let state = Arc::new(Mutex::new(AchievementUnlockerState {
            is_running: true,
            ..Default::default()
        }));
        let stopped = Arc::new(AtomicBool::new(false));
        let max_concurrent_games = Arc::new(AtomicU32::new(worker_count));
        let idling_apps: Arc<Mutex<HashMap<u32, String>>> = Arc::new(Mutex::new(HashMap::new()));
        let excluded_app_ids: Arc<Mutex<HashSet<u32>>> = Arc::new(Mutex::new(HashSet::new()));

        let handle = tokio::spawn(run_loop(
            app_handle.clone(),
            steam_id.clone(),
            account,
            max_concurrent_games.clone(),
            state.clone(),
            stopped.clone(),
            idling_apps.clone(),
            excluded_app_ids.clone(),
        ));

        let snapshot = state.lock().await.clone();
        self.sessions.lock().await.insert(
            steam_id,
            UnlockerSession {
                handle,
                stopped,
                state,
                max_concurrent_games,
                idling_apps,
                excluded_app_ids,
            },
        );
        Ok(snapshot)
    }

    /// Live-updates `steam_id`'s running session's worker count, if one is running - a no-op
    /// otherwise (nothing to correct). Re-clamped the same way `start` clamps its initial value.
    /// Takes effect at the start of the session's *next* pass (see [`run_loop`]'s doc comment) -
    /// never interrupts whichever game is currently mid-unlock.
    pub async fn set_max_concurrent_games(&self, steam_id: &str, max_concurrent_games: u32) {
        if let Some(session) = self.sessions.lock().await.get(steam_id) {
            session.max_concurrent_games.store(
                max_concurrent_games.clamp(1, MAX_CONCURRENT_GAMES),
                Ordering::SeqCst,
            );
        }
    }

    /// Stops `steam_id`'s session if one is running - idempotent. Sets a flag and awaits the task's
    /// own cleanup rather than aborting it outright, same reasoning as `CardFarmingManager::stop`:
    /// aborting mid-`set_idle_games` call could leave a game idling with nothing left to stop it.
    pub async fn stop(&self, steam_id: &str) -> AppResult<()> {
        let session = self.sessions.lock().await.remove(steam_id);
        let Some(session) = session else {
            return Ok(());
        };
        session.stopped.store(true, Ordering::SeqCst);
        let _ = session.handle.await;
        Ok(())
    }

    pub async fn state(&self, steam_id: &str) -> AchievementUnlockerState {
        match self.sessions.lock().await.get(steam_id) {
            Some(session) => session.state.lock().await.clone(),
            None => AchievementUnlockerState::default(),
        }
    }

    /// Excludes `app_id` from idling for the rest of a running session for `steam_id` - the
    /// Idling page's per-card "stop" toggle already releases the actual idling claim via
    /// `idling::claims::IdleClaimsRegistry::release_app_id` (this session finds out its game
    /// stopped idling from that, not from here), but this manager tracks its own desired idling
    /// set (`idling_apps`) independently and would otherwise never learn a specific game was
    /// pulled out from under it - the next unrelated `set_game_idling` call (a different worker's
    /// game starting/stopping its own idling) re-announces this session's *entire* current
    /// `idling_apps` map, silently resurrecting the game the user just stopped. Removing it from
    /// `idling_apps` here closes that immediate resurrection path; recording it in
    /// `excluded_app_ids` additionally stops *this same* game's own worker from re-idling it later
    /// (e.g. resuming after a schedule-wait pause) - see `unlock_game`'s one
    /// `set_game_idling(..., true)` call site.
    ///
    /// Deliberately doesn't touch the achievement-unlocking work itself (the queue, `active`, or
    /// the worker currently processing this game) - unlike card farming, where idling *is* the
    /// entire activity, achievement unlocking only optionally idles a game
    /// (`settings::AchievementUnlockerSettings::idle`) as a side effect, so stopping a game's
    /// idling from the Idling page shouldn't also silently abandon its in-progress unlock queue
    /// entry. A no-op (`false`, nothing logged) if no session is running for `steam_id` or the
    /// game wasn't currently idling under it - `excluded_app_ids` is still recorded either way,
    /// pre-emptively covering a game mid-schedule-wait that hasn't started idling yet.
    pub async fn remove_active_game(&self, steam_id: &str, app_id: u32) -> bool {
        // See `CardFarmingManager::remove_active_game`'s identical doc comment for why the
        // manager-wide `sessions` lock is dropped before the per-session locks below.
        let (idling_apps, excluded_app_ids) = {
            let sessions = self.sessions.lock().await;
            let Some(session) = sessions.get(steam_id) else {
                return false;
            };
            (session.idling_apps.clone(), session.excluded_app_ids.clone())
        };
        excluded_app_ids.lock().await.insert(app_id);
        let removed = idling_apps.lock().await.remove(&app_id).is_some();
        if removed {
            tracing::info!(
                steam_id,
                app_id,
                "achievement unlocker: game excluded from idling for the rest of this session (manually stopped via idling page)"
            );
        }
        removed
    }

    async fn remove(&self, steam_id: &str) {
        self.sessions.lock().await.remove(steam_id);
    }
}

/// A schema achievement, already filtered/ordered/annotated - what survives [`scan_game`] and
/// feeds [`unlock_game`]. `delay_next_unlock_ms` is `Some` only when a custom per-achievement delay
/// was configured (`order::AchievementOrderEntry::delay_next_unlock`); otherwise a fresh random
/// delay (from `settings.interval`) is drawn once per game in [`unlock_game`], matching `main`'s
/// `delayMap` (computed once per game, reused for both the real wait and the displayed projection).
#[derive(Clone)]
struct ScannedAchievement {
    id: String,
    name: String,
    icon_locked: String,
    percent: Option<f32>,
    delay_next_unlock_ms: Option<u64>,
}

struct ScannedGame {
    app_id: u32,
    name: String,
    achievements: Vec<ScannedAchievement>,
    delay_before_first_unlock_ms: u64,
    /// The initial `ActiveGameProgress::achievement_count` value - the per-game max-unlocks
    /// override if one exists, otherwise every achievement found. Deliberately `unwrap_or`, not
    /// `main`'s `maxAchievementUnlocks || achievements.length` - a JS-falsy `0` override would
    /// silently fall back to "no override" there; `Option::unwrap_or` doesn't have that gotcha.
    achievement_count: u32,
}

/// Reason the outer loop in [`run_loop`] ended - only [`EndReason::QueueEmpty`] triggers next-task
/// chaining, mirroring `main`'s `finalize()` only ever being reached when the backlog is genuinely
/// empty (never on a user-initiated stop or a hard read error).
enum EndReason {
    Stopped,
    QueueEmpty,
    Error,
}

async fn emit_state(
    app_handle: &AppHandle,
    steam_id: &str,
    state: &Mutex<AchievementUnlockerState>,
) {
    let snapshot = state.lock().await.clone();
    let _ = app_handle.emit(
        ACHIEVEMENT_UNLOCKER_STATE_EVENT,
        serde_json::json!({ "steamId": steam_id, "state": snapshot }),
    );
}

async fn add_active(
    state: &Mutex<AchievementUnlockerState>,
    app_id: u32,
    name: &str,
    is_initial_delay: bool,
    achievement_count: u32,
) {
    let mut s = state.lock().await;
    s.active.push(ActiveGameProgress {
        app_id,
        name: name.to_string(),
        is_initial_delay,
        initial_delay_ends_at_ms: is_initial_delay
            .then(|| chrono::Utc::now().timestamp_millis() + INITIAL_DELAY.as_millis() as i64),
        is_waiting_for_schedule: false,
        achievement_count,
        upcoming: Vec::new(),
    });
}

async fn remove_active(state: &Mutex<AchievementUnlockerState>, app_id: u32) {
    let mut s = state.lock().await;
    s.active.retain(|g| g.app_id != app_id);
}

/// Records a game's outcome for this session's "finished" summary - see [`CompletedUnlock`]'s doc
/// comment for which exit paths call this (and which deliberately don't).
async fn add_completed(
    state: &Mutex<AchievementUnlockerState>,
    app_id: u32,
    name: &str,
    unlocked: u32,
    total: u32,
    reason: CompletedUnlockReason,
) {
    let mut s = state.lock().await;
    s.completed.push(CompletedUnlock {
        app_id,
        name: name.to_string(),
        unlocked,
        total,
        reason,
    });
}

async fn update_game(
    state: &Mutex<AchievementUnlockerState>,
    app_id: u32,
    f: impl FnOnce(&mut ActiveGameProgress),
) {
    let mut s = state.lock().await;
    if let Some(g) = s.active.iter_mut().find(|g| g.app_id == app_id) {
        f(g);
    }
}

/// Projects the next [`UPCOMING_LIMIT`] achievements starting at `achievements[start_index..]` and
/// when each will unlock, matching `main`'s `buildUpcomingQueue`: the first projected item lands at
/// `now + initial_delay_ms`, each subsequent one adds the *previous* achievement's own resolved
/// delay (`delays[i - 1]`) - the same values actually used to pace the real unlocks, so the
/// projection and the real wait can never disagree.
async fn update_upcoming(
    state: &Mutex<AchievementUnlockerState>,
    app_id: u32,
    achievements: &[ScannedAchievement],
    delays: &[u64],
    start_index: usize,
    initial_delay_ms: u64,
) {
    let now = chrono::Utc::now().timestamp_millis();
    let mut cumulative = initial_delay_ms as i64;
    let mut upcoming = Vec::new();
    for i in start_index..achievements.len() {
        if upcoming.len() >= UPCOMING_LIMIT {
            break;
        }
        if i > start_index {
            cumulative += delays[i - 1] as i64;
        }
        let achievement = &achievements[i];
        upcoming.push(UpcomingAchievement {
            id: achievement.id.clone(),
            name: achievement.name.clone(),
            icon_locked: achievement.icon_locked.clone(),
            percent: achievement.percent,
            unlock_at_ms: now + cumulative,
        });
    }
    update_game(state, app_id, |g| g.upcoming = upcoming).await;
}

fn random_delay_ms(min_minutes: u32, max_minutes: u32) -> u64 {
    let min_ms = min_minutes as u64 * 60_000;
    let max_ms = max_minutes as u64 * 60_000;
    if max_ms <= min_ms {
        return min_ms;
    }
    min_ms + rand::thread_rng().gen_range(0..=(max_ms - min_ms))
}

/// Whether the current local wall-clock time falls within `[from, to)`, wrapping past midnight if
/// `to` is earlier than `from` (an overnight schedule, e.g. 22:00 to 06:00) - ported from `main`'s
/// `isWithinSchedule` (`src/shared/utils/handleAutomation.ts`), just against `chrono::Local` instead
/// of `@internationalized/date`'s `Time`.
fn is_within_schedule(from: ScheduleTime, to: ScheduleTime) -> bool {
    let now = chrono::Local::now();
    let current = (now.hour(), now.minute());
    let from_t = (from.hour as u32, from.minute as u32);
    let to_t = (to.hour as u32, to.minute as u32);
    if to_t < from_t {
        current >= from_t || current < to_t
    } else {
        current >= from_t && current < to_t
    }
}

/// Blocks until `is_within_schedule(from, to)` is true, re-checking every 60s (ticked via
/// [`wait_ticking`] so a stop takes effect within ~1s, not up to a full minute late) - returns
/// `true` if a stop was detected while waiting.
async fn wait_until_in_schedule(
    from: ScheduleTime,
    to: ScheduleTime,
    stopped: &AtomicBool,
) -> bool {
    while !is_within_schedule(from, to) {
        if wait_ticking(Duration::from_secs(60), stopped).await {
            return true;
        }
    }
    false
}

/// Claims or releases `app_id` in this session's own desired idling set, then re-announces this
/// session's *entire* set as one owner claim via `idling::claims::IdleClaimsRegistry` while still
/// holding the lock - serializes concurrent announces from different workers into one consistent
/// sequence, same coarse-lock reasoning `achievement_unlocker::order`'s per-path lock map already
/// documents. The registry itself unions this claim with every other owner's (manual/auto-idle/
/// card-farming), so this no longer risks dropping games another owner started - see
/// `idling::claims`'s module doc comment.
async fn set_game_idling(
    idling_apps: &Mutex<HashMap<u32, String>>,
    app_handle: &AppHandle,
    account: &GamesAccount,
    app_id: u32,
    name: &str,
    want_idling: bool,
) {
    let mut apps = idling_apps.lock().await;
    if want_idling {
        apps.insert(app_id, name.to_string());
        tracing::info!(app_id, name, "achievement unlocker: started idling");
    } else {
        apps.remove(&app_id);
        tracing::info!(app_id, name, "achievement unlocker: stopped idling");
    }
    let targets: Vec<IdleTarget> = apps
        .iter()
        .map(|(id, n)| IdleTarget {
            app_id: *id,
            name: n.clone(),
        })
        .collect();
    let agent_manager = app_handle.state::<AgentManager>();
    let idling_manager = app_handle.state::<IdlingManager>();
    let claims = app_handle.state::<idling::claims::IdleClaimsRegistry>();
    if let Err(e) = claims
        .replace_owner_claim(
            app_handle,
            agent_manager,
            idling_manager,
            account.clone(),
            idling::claims::OWNER_ACHIEVEMENT_UNLOCKER,
            targets,
        )
        .await
    {
        tracing::warn!(app_id, error = %e.code(), "achievement unlocker: failed to update the idling set");
    }
}

/// Fetches and prepares `entry`'s achievement data for unlocking - filters out already-achieved
/// achievements (and, if `settings.hidden` is on, hidden ones too), applies a saved custom order if
/// one exists (dropping skipped achievements, sorting the rest by saved position with unordered
/// achievements falling back to percent-descending at the end - matches `main`'s
/// `fetchAchievements`), or falls back to plain percent-descending. A game with a schema that
/// reports any `protected_achievement` is treated as having nothing to unlock (matches `main`'s
/// same "can't safely automate this game" treatment). Never hard-errors - any failure (fetch,
/// settings, order) also resolves to "nothing to unlock", matching `main`'s catch-all behavior of
/// removing a game from the queue on any non-actionable scan result, not just a clean empty list.
async fn scan_game(
    app_handle: &AppHandle,
    account: &GamesAccount,
    steam_id: &str,
    entry: &AchievementUnlockerEntry,
) -> ScannedGame {
    let empty = |achievement_count| ScannedGame {
        app_id: entry.app_id,
        name: entry.name.clone(),
        achievements: Vec::new(),
        delay_before_first_unlock_ms: 0,
        achievement_count,
    };

    let unlocker_settings = match settings::get(app_handle, steam_id).await {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!(app_id = entry.app_id, error = %e.code(), "achievement unlocker: failed to read settings during scan");
            return empty(0);
        }
    };
    let max_unlocks = settings::get_max_unlocks(app_handle, steam_id, entry.app_id)
        .await
        .unwrap_or(None);

    let agent_manager = app_handle.state::<AgentManager>();
    // Backend automation loop, no frontend locale to follow - the fetched name/description are
    // only ever used in `tracing::` log lines below, not shown to the user, so "english" is fine.
    let data = match achievements::commands::get_achievement_data(
        agent_manager,
        account.clone(),
        entry.app_id,
        "english".to_string(),
    )
    .await
    {
        Ok(d) => d,
        Err(e) => {
            tracing::warn!(app_id = entry.app_id, name = %entry.name, error = %e.code(), "achievement unlocker: failed to fetch achievement data, removing from queue");
            return empty(0);
        }
    };

    if data.achievements.iter().any(|a| a.protected_achievement) {
        tracing::info!(app_id = entry.app_id, name = %entry.name, "achievement unlocker: game has protected achievements, removing from queue");
        return empty(0);
    }

    let eligible: Vec<&AchievementDto> = data
        .achievements
        .iter()
        .filter(|a| !a.achieved && (!unlocker_settings.hidden || !a.hidden))
        .collect();

    let saved_order = order::get(app_handle, steam_id, entry.app_id)
        .await
        .ok()
        .flatten();
    tracing::info!(
        app_id = entry.app_id,
        name = %entry.name,
        has_custom_order = saved_order.is_some(),
        "achievement unlocker: scanned game"
    );

    let (achievements, delay_before_first_unlock_ms) = if let Some(saved) = &saved_order {
        let position: HashMap<&str, usize> = saved
            .achievements
            .iter()
            .enumerate()
            .map(|(i, e)| (e.id.as_str(), i))
            .collect();
        let skipped: HashSet<&str> = saved
            .achievements
            .iter()
            .filter(|e| e.skip)
            .map(|e| e.id.as_str())
            .collect();
        let delay_by_id: HashMap<&str, f64> = saved
            .achievements
            .iter()
            .filter_map(|e| e.delay_next_unlock.map(|d| (e.id.as_str(), d)))
            .collect();

        let mut ordered: Vec<&AchievementDto> = eligible
            .into_iter()
            .filter(|a| !skipped.contains(a.id.as_str()))
            .collect();
        ordered.sort_by(
            |a, b| match (position.get(a.id.as_str()), position.get(b.id.as_str())) {
                (Some(pa), Some(pb)) => pa.cmp(pb),
                (Some(_), None) => CmpOrdering::Less,
                (None, Some(_)) => CmpOrdering::Greater,
                (None, None) => b
                    .percent
                    .unwrap_or(0.0)
                    .partial_cmp(&a.percent.unwrap_or(0.0))
                    .unwrap_or(CmpOrdering::Equal),
            },
        );

        let scanned: Vec<ScannedAchievement> = ordered
            .into_iter()
            .map(|a| ScannedAchievement {
                id: a.id.clone(),
                name: a.name.clone(),
                icon_locked: a.icon_locked.clone(),
                percent: a.percent,
                delay_next_unlock_ms: delay_by_id
                    .get(a.id.as_str())
                    .map(|minutes| (*minutes * 60_000.0) as u64),
            })
            .collect();
        let delay_ms = saved
            .delay_before_first_unlock
            .map(|minutes| (minutes * 60_000.0) as u64)
            .unwrap_or(0);
        (scanned, delay_ms)
    } else {
        let mut sorted = eligible;
        sorted.sort_by(|a, b| {
            b.percent
                .unwrap_or(0.0)
                .partial_cmp(&a.percent.unwrap_or(0.0))
                .unwrap_or(CmpOrdering::Equal)
        });
        let scanned: Vec<ScannedAchievement> = sorted
            .into_iter()
            .map(|a| ScannedAchievement {
                id: a.id.clone(),
                name: a.name.clone(),
                icon_locked: a.icon_locked.clone(),
                percent: a.percent,
                delay_next_unlock_ms: None,
            })
            .collect();
        (scanned, 0)
    };

    let achievement_count = max_unlocks
        .unwrap_or(achievements.len() as u32)
        .min(achievements.len() as u32);

    ScannedGame {
        app_id: entry.app_id,
        name: entry.name.clone(),
        achievements,
        delay_before_first_unlock_ms,
        achievement_count,
    }
}

/// Phase 1 of one pass: scans every game in `backlog` concurrently across `worker_count` workers,
/// removing from the queue (via `cache::remove`) any game that resolves to nothing left to unlock,
/// and returns every game that does. Reports live `ScanProgress` via `state`/the state event as
/// each game finishes, matching `main`'s scan-progress UI.
#[allow(clippy::too_many_arguments)]
async fn run_scan_phase(
    app_handle: &AppHandle,
    account: &GamesAccount,
    steam_id: &str,
    backlog: Vec<AchievementUnlockerEntry>,
    worker_count: u32,
    state: &Arc<Mutex<AchievementUnlockerState>>,
    stopped: &Arc<AtomicBool>,
) -> Vec<ScannedGame> {
    let total = backlog.len() as u32;
    {
        let mut s = state.lock().await;
        s.scan_progress = Some(ScanProgress { checked: 0, total });
    }
    emit_state(app_handle, steam_id, state).await;

    // Best-effort playtime lookup for the max-playtime exclusion below - read once for the whole
    // pass rather than per game, same reasoning as `auto_idle::commands::start_auto_idle_games`.
    let playtime_by_app_id: Arc<HashMap<u32, u64>> = Arc::new(
        crate::games::commands::get_owned_games_cache(app_handle.clone(), steam_id.to_string())
            .unwrap_or_default()
            .into_iter()
            .map(|g| (g.app_id, g.playtime_forever_minutes))
            .collect(),
    );

    let queue = Arc::new(Mutex::new(VecDeque::from(backlog)));
    let checked = Arc::new(std::sync::atomic::AtomicU32::new(0));
    let mut handles = Vec::new();

    for _ in 0..worker_count {
        let queue = queue.clone();
        let checked = checked.clone();
        let app_handle = app_handle.clone();
        let account = account.clone();
        let steam_id = steam_id.to_string();
        let state = state.clone();
        let stopped = stopped.clone();
        let playtime_by_app_id = playtime_by_app_id.clone();

        handles.push(tokio::spawn(async move {
            let mut ready = Vec::new();
            loop {
                if stopped.load(Ordering::SeqCst) {
                    break;
                }
                let entry = { queue.lock().await.pop_front() };
                let Some(entry) = entry else { break };

                let playtime = playtime_by_app_id.get(&entry.app_id).copied().unwrap_or(0);
                let over_cap = crate::max_playtime::settings::is_over_cap(
                    &app_handle,
                    &steam_id,
                    entry.app_id,
                    playtime,
                )
                .await
                .unwrap_or(false);
                if over_cap {
                    if let Err(e) = cache::remove(&app_handle, &steam_id, entry.app_id).await {
                        tracing::warn!(app_id = entry.app_id, error = %e.code(), "achievement unlocker: failed to remove over-max-playtime game from queue");
                    } else {
                        tracing::info!(app_id = entry.app_id, "achievement unlocker: removed over-max-playtime game from queue");
                    }
                    add_completed(
                        &state,
                        entry.app_id,
                        &entry.name,
                        0,
                        0,
                        CompletedUnlockReason::MaxPlaytime,
                    )
                    .await;
                    let n = checked.fetch_add(1, Ordering::SeqCst) + 1;
                    {
                        let mut s = state.lock().await;
                        s.scan_progress = if n < total {
                            Some(ScanProgress { checked: n, total })
                        } else {
                            None
                        };
                    }
                    emit_state(&app_handle, &steam_id, &state).await;
                    continue;
                }

                let scanned = scan_game(&app_handle, &account, &steam_id, &entry).await;

                let n = checked.fetch_add(1, Ordering::SeqCst) + 1;
                {
                    let mut s = state.lock().await;
                    s.scan_progress = if n < total {
                        Some(ScanProgress { checked: n, total })
                    } else {
                        None
                    };
                }
                emit_state(&app_handle, &steam_id, &state).await;

                if scanned.achievements.is_empty() {
                    if let Err(e) = cache::remove(&app_handle, &steam_id, entry.app_id).await {
                        tracing::warn!(app_id = entry.app_id, error = %e.code(), "achievement unlocker: failed to remove exhausted game from queue");
                    }
                    add_completed(
                        &state,
                        entry.app_id,
                        &entry.name,
                        0,
                        0,
                        CompletedUnlockReason::NothingToUnlock,
                    )
                    .await;
                    emit_state(&app_handle, &steam_id, &state).await;
                } else {
                    ready.push(scanned);
                }
            }
            ready
        }));
    }

    let mut ready = Vec::new();
    for handle in handles {
        if let Ok(mut v) = handle.await {
            ready.append(&mut v);
        }
    }

    {
        let mut s = state.lock().await;
        s.scan_progress = None;
    }
    emit_state(app_handle, steam_id, state).await;

    ready
}

/// Unlocks every achievement in `game`, one at a time, in order - schedule-waiting, idling, retrying
/// failed unlocks up to [`MAX_UNLOCK_ATTEMPTS`] times, and stopping early once either every
/// achievement is unlocked or the per-game max-unlocks override is reached (matches `main`'s
/// `unlockAchievements`). Settings are read once at the start and reused for the whole game, same
/// as `main` - a mid-run settings change only takes effect for the *next* game a worker picks up.
#[allow(clippy::too_many_arguments)]
async fn unlock_game(
    app_handle: &AppHandle,
    account: &GamesAccount,
    steam_id: &str,
    game: &ScannedGame,
    state: &Arc<Mutex<AchievementUnlockerState>>,
    idling_apps: &Arc<Mutex<HashMap<u32, String>>>,
    excluded_app_ids: &Arc<Mutex<HashSet<u32>>>,
    stopped: &Arc<AtomicBool>,
) {
    let app_id = game.app_id;

    let unlocker_settings = settings::get(app_handle, steam_id)
        .await
        .unwrap_or_default();
    let max_unlocks = settings::get_max_unlocks(app_handle, steam_id, app_id)
        .await
        .unwrap_or(None);

    // Baseline for the per-achievement max-playtime check below - read once per game, not per
    // achievement, same reasoning as `run_scan_phase`'s own playtime lookup (a cache read, not a
    // live one - see `max_playtime::enforcement`'s doc comment for why this estimates forward from
    // a baseline instead of re-fetching every check).
    let baseline_playtime_minutes =
        crate::games::commands::get_owned_games_cache(app_handle.clone(), steam_id.to_string())
            .unwrap_or_default()
            .into_iter()
            .find(|g| g.app_id == app_id)
            .map(|g| g.playtime_forever_minutes)
            .unwrap_or(0);
    let unlock_started_at = std::time::Instant::now();

    // Resolved once per game, not per achievement, so the projected `upcoming` queue and the real
    // wait always agree - matches `main`'s `delayMap`.
    let delays: Vec<u64> = game
        .achievements
        .iter()
        .map(|a| {
            a.delay_next_unlock_ms.unwrap_or_else(|| {
                random_delay_ms(unlocker_settings.interval[0], unlocker_settings.interval[1])
            })
        })
        .collect();

    if game.delay_before_first_unlock_ms > 0 {
        tracing::info!(
            app_id,
            name = %game.name,
            delay_minutes = game.delay_before_first_unlock_ms / 60_000,
            "achievement unlocker: waiting before first unlock"
        );
        update_upcoming(
            state,
            app_id,
            &game.achievements,
            &delays,
            0,
            game.delay_before_first_unlock_ms,
        )
        .await;
        emit_state(app_handle, steam_id, state).await;
        if wait_ticking(
            Duration::from_millis(game.delay_before_first_unlock_ms),
            stopped,
        )
        .await
        {
            return;
        }
    } else {
        update_upcoming(state, app_id, &game.achievements, &delays, 0, 0).await;
    }

    let total = game.achievements.len() as u32;
    let mut remaining = total;
    let mut is_idling = false;

    for (index, achievement) in game.achievements.iter().enumerate() {
        if stopped.load(Ordering::SeqCst) {
            break;
        }

        let estimated_playtime_minutes =
            baseline_playtime_minutes + unlock_started_at.elapsed().as_secs() / 60;
        let over_max_playtime = crate::max_playtime::settings::is_over_cap(
            app_handle,
            steam_id,
            app_id,
            estimated_playtime_minutes,
        )
        .await
        .unwrap_or(false);
        if over_max_playtime {
            tracing::info!(app_id, name = %game.name, "achievement unlocker: max playtime cap reached, removing from queue");
            if is_idling {
                set_game_idling(idling_apps, app_handle, account, app_id, &game.name, false).await;
                is_idling = false;
            }
            // Unlike a `stopped`-triggered break (a pause the user may resume), this game has
            // permanently hit its cap for this session and must be dequeued here - otherwise the
            // next pass re-reads the same stale `get_owned_games_cache` baseline this check itself
            // used, doesn't see it as over cap yet, re-adds it, and `unlock_started_at` resets to
            // zero - so it takes another few minutes to re-trip this same check. That non-removal
            // let the same game cycle through scan -> unlock -> break indefinitely, so the session
            // never reached `EndReason::QueueEmpty` and `is_running` stayed stuck `true`.
            if let Err(e) = cache::remove(app_handle, steam_id, app_id).await {
                tracing::warn!(app_id, error = %e.code(), "achievement unlocker: failed to remove over-max-playtime game from queue");
            }
            add_completed(
                state,
                app_id,
                &game.name,
                total - remaining,
                total,
                CompletedUnlockReason::MaxPlaytime,
            )
            .await;
            break;
        }

        if unlocker_settings.schedule
            && !is_within_schedule(
                unlocker_settings.schedule_from,
                unlocker_settings.schedule_to,
            )
        {
            if is_idling {
                set_game_idling(idling_apps, app_handle, account, app_id, &game.name, false).await;
                is_idling = false;
            }
            update_game(state, app_id, |g| g.is_waiting_for_schedule = true).await;
            emit_state(app_handle, steam_id, state).await;

            if wait_until_in_schedule(
                unlocker_settings.schedule_from,
                unlocker_settings.schedule_to,
                stopped,
            )
            .await
            {
                break;
            }
            update_game(state, app_id, |g| g.is_waiting_for_schedule = false).await;
            emit_state(app_handle, steam_id, state).await;
        } else if !is_idling
            && unlocker_settings.idle
            && !excluded_app_ids.lock().await.contains(&app_id)
        {
            set_game_idling(idling_apps, app_handle, account, app_id, &game.name, true).await;
            is_idling = true;
        }

        if stopped.load(Ordering::SeqCst) {
            break;
        }

        let mut succeeded = false;
        for attempt in 0..MAX_UNLOCK_ATTEMPTS {
            if stopped.load(Ordering::SeqCst) {
                break;
            }
            let agent_manager = app_handle.state::<AgentManager>();
            succeeded = achievements::commands::set_achievement(
                agent_manager,
                account.clone(),
                app_id,
                achievement.id.clone(),
                true,
            )
            .await
            .is_ok();
            if succeeded {
                break;
            }
            if attempt < MAX_UNLOCK_ATTEMPTS - 1
                && wait_ticking(RETRY_BACKOFF[attempt], stopped).await
            {
                break;
            }
        }

        if stopped.load(Ordering::SeqCst) {
            break;
        }

        if succeeded {
            remaining = remaining.saturating_sub(1);
            update_game(state, app_id, |g| {
                g.achievement_count = g.achievement_count.saturating_sub(1)
            })
            .await;
            tracing::info!(app_id, name = %achievement.name, "achievement unlocker: unlocked");

            let processed = total - remaining;
            let hit_max = max_unlocks.is_some_and(|m| processed >= m);
            if remaining == 0 || hit_max {
                if is_idling {
                    set_game_idling(idling_apps, app_handle, account, app_id, &game.name, false)
                        .await;
                }
                tracing::info!(
                    app_id,
                    name = %game.name,
                    unlocked = processed,
                    total,
                    hit_max,
                    "achievement unlocker: finished game, removing from queue"
                );
                if let Err(e) = cache::remove(app_handle, steam_id, app_id).await {
                    tracing::warn!(app_id, error = %e.code(), "achievement unlocker: failed to remove completed game from queue");
                }
                // `remaining == 0` takes priority over `hit_max` when both happen to be true at
                // once (the very last achievement also happening to be the one that crosses the
                // cap) - "ran out of achievements" is the more informative label there, since
                // there's nothing left regardless of the cap.
                let reason = if remaining == 0 {
                    CompletedUnlockReason::Finished
                } else {
                    CompletedUnlockReason::MaxUnlocksReached
                };
                add_completed(state, app_id, &game.name, processed, total, reason).await;
                update_game(state, app_id, |g| g.upcoming.clear()).await;
                emit_state(app_handle, steam_id, state).await;
                return;
            }
        } else {
            tracing::warn!(app_id, name = %achievement.name, attempts = MAX_UNLOCK_ATTEMPTS, "achievement unlocker: giving up on this achievement for now - will retry next scan pass");
        }

        let delay_ms = delays[index];
        update_upcoming(
            state,
            app_id,
            &game.achievements,
            &delays,
            index + 1,
            delay_ms,
        )
        .await;
        emit_state(app_handle, steam_id, state).await;
        if wait_ticking(Duration::from_millis(delay_ms), stopped).await {
            break;
        }
    }

    if is_idling {
        set_game_idling(idling_apps, app_handle, account, app_id, &game.name, false).await;
    }
}

/// Phase 2 of one pass: unlocks every game in `ready` across `worker_count` workers, pulled from a
/// shared queue (work-stealing, matching `main`'s `unlockWorker`). The first game a given worker
/// picks up always gets the fixed [`INITIAL_DELAY`] grace period; later ones get
/// [`INTER_GAME_DELAY`] only in single-worker mode and only when the game has no
/// `delayBeforeFirstUnlock` of its own (matches `main`'s `gameHasPreDelay` check, reusing the value
/// already computed during scanning instead of re-reading the order file a second time).
#[allow(clippy::too_many_arguments)]
async fn run_unlock_phase(
    app_handle: &AppHandle,
    account: &GamesAccount,
    steam_id: &str,
    ready: Vec<ScannedGame>,
    worker_count: u32,
    state: &Arc<Mutex<AchievementUnlockerState>>,
    idling_apps: &Arc<Mutex<HashMap<u32, String>>>,
    excluded_app_ids: &Arc<Mutex<HashSet<u32>>>,
    stopped: &Arc<AtomicBool>,
) {
    let queue = Arc::new(Mutex::new(VecDeque::from(ready)));
    let mut handles = Vec::new();

    for _ in 0..worker_count {
        let queue = queue.clone();
        let app_handle = app_handle.clone();
        let account = account.clone();
        let steam_id = steam_id.to_string();
        let state = state.clone();
        let idling_apps = idling_apps.clone();
        let excluded_app_ids = excluded_app_ids.clone();
        let stopped = stopped.clone();

        handles.push(tokio::spawn(async move {
            let mut is_first = true;
            loop {
                if stopped.load(Ordering::SeqCst) {
                    break;
                }
                let game = { queue.lock().await.pop_front() };
                let Some(game) = game else { break };

                if is_first {
                    add_active(
                        &state,
                        game.app_id,
                        &game.name,
                        true,
                        game.achievement_count,
                    )
                    .await;
                    emit_state(&app_handle, &steam_id, &state).await;
                    if wait_ticking(INITIAL_DELAY, &stopped).await {
                        remove_active(&state, game.app_id).await;
                        emit_state(&app_handle, &steam_id, &state).await;
                        break;
                    }
                    update_game(&state, game.app_id, |g| {
                        g.is_initial_delay = false;
                        g.initial_delay_ends_at_ms = None;
                    })
                    .await;
                } else {
                    let has_pre_delay = game.delay_before_first_unlock_ms > 0;
                    if !has_pre_delay && worker_count == 1 {
                        tracing::info!(
                            next_app_id = game.app_id,
                            next_name = %game.name,
                            "achievement unlocker: switching to next game shortly"
                        );
                        if wait_ticking(INTER_GAME_DELAY, &stopped).await {
                            break;
                        }
                    }
                    if stopped.load(Ordering::SeqCst) {
                        break;
                    }
                    add_active(
                        &state,
                        game.app_id,
                        &game.name,
                        false,
                        game.achievement_count,
                    )
                    .await;
                }
                is_first = false;
                emit_state(&app_handle, &steam_id, &state).await;

                unlock_game(
                    &app_handle,
                    &account,
                    &steam_id,
                    &game,
                    &state,
                    &idling_apps,
                    &excluded_app_ids,
                    &stopped,
                )
                .await;

                remove_active(&state, game.app_id).await;
                emit_state(&app_handle, &steam_id, &state).await;
            }
        }));
    }

    for handle in handles {
        let _ = handle.await;
    }
}

/// Once the queue is genuinely empty (see [`EndReason::QueueEmpty`]), starts whatever
/// `settings.next_task` names, if `next_task_checkbox` is on: `"cardFarming"` or `"autoIdle"`
/// (`auto_idle::commands::start_auto_idle_games`).
///
/// A plain `fn` returning a boxed trait object, not `async fn` (which would return an opaque
/// `impl Future`) - `card_farming::manager` has its own `maybe_start_next_task` that can chain
/// back into this exact module (`next_task: "achievementUnlocker"`), and each one's `tokio::spawn`
/// call (`CardFarmingManager::start`/`AchievementUnlockerManager::start`) already needs its own
/// session-loop function's hidden type to be `Send`. Left as `async fn`, that hidden-type
/// computation becomes genuinely self-referential across the two modules - rustc's opaque-type
/// resolver can't solve it ("fetching the hidden types of an opaque inside of the defining scope
/// is not supported"). Declaring the return type explicitly here (rather than letting it be
/// inferred) removes this function from that opaque-type graph entirely; `card_farming::manager`'s
/// own `maybe_start_next_task` needs the identical treatment for the same reason.
fn maybe_start_next_task<'a>(
    app_handle: &'a AppHandle,
    account: &'a GamesAccount,
    steam_id: &'a str,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + 'a>> {
    Box::pin(async move {
        let unlocker_settings = match settings::get(app_handle, steam_id).await {
            Ok(s) => s,
            Err(_) => return,
        };
        if !unlocker_settings.next_task_checkbox {
            return;
        }

        match unlocker_settings.next_task.as_deref() {
            Some("cardFarming") => {
                let agent_manager = app_handle.state::<AgentManager>();
                let card_farming_manager = app_handle.state::<card_farming::CardFarmingManager>();
                match card_farming::commands::start_farming(
                    app_handle.clone(),
                    agent_manager,
                    card_farming_manager,
                    account.clone(),
                    None,
                )
                .await
                {
                    Ok(_) => {
                        tracing::info!(
                            steam_id,
                            "achievement unlocker: queue empty, starting card farming next task"
                        )
                    }
                    Err(e) => {
                        tracing::warn!(steam_id, error = %e.code(), "achievement unlocker: failed to start next task (card farming)")
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
                            "achievement unlocker: queue empty, starting auto-idle next task"
                        )
                    }
                    Err(e) => {
                        tracing::warn!(steam_id, error = %e.code(), "achievement unlocker: failed to start next task (auto-idle)")
                    }
                }
            }
            _ => {}
        }
    })
}

/// The session itself: repeats scan-then-unlock passes until the queue is genuinely empty or a stop
/// is requested, then releases any idling this session claimed, clears the tracked state, chains
/// into the next task if configured (only on a genuine empty-queue ending), and deregisters itself
/// from the manager.
#[allow(clippy::too_many_arguments)]
async fn run_loop(
    app_handle: AppHandle,
    steam_id: String,
    account: GamesAccount,
    max_concurrent_games: Arc<AtomicU32>,
    state: Arc<Mutex<AchievementUnlockerState>>,
    stopped: Arc<AtomicBool>,
    idling_apps: Arc<Mutex<HashMap<u32, String>>>,
    excluded_app_ids: Arc<Mutex<HashSet<u32>>>,
) {
    let end_reason;

    loop {
        if stopped.load(Ordering::SeqCst) {
            end_reason = EndReason::Stopped;
            break;
        }

        let backlog = match cache::read(&app_handle, &steam_id).await {
            Ok(b) => b,
            Err(e) => {
                tracing::warn!(steam_id, error = %e.code(), "achievement unlocker: failed to read queue, ending session");
                end_reason = EndReason::Error;
                break;
            }
        };
        if backlog.is_empty() {
            end_reason = EndReason::QueueEmpty;
            break;
        }

        // Re-read fresh for every pass (see this module's doc comment) rather than once at
        // session start - the one point a subscription downgrade mid-run actually takes effect.
        let worker_count = max_concurrent_games
            .load(Ordering::SeqCst)
            .clamp(1, MAX_CONCURRENT_GAMES);

        let ready = run_scan_phase(
            &app_handle,
            &account,
            &steam_id,
            backlog,
            worker_count,
            &state,
            &stopped,
        )
        .await;
        if stopped.load(Ordering::SeqCst) {
            end_reason = EndReason::Stopped;
            break;
        }
        if ready.is_empty() {
            continue;
        }

        run_unlock_phase(
            &app_handle,
            &account,
            &steam_id,
            ready,
            worker_count,
            &state,
            &idling_apps,
            &excluded_app_ids,
            &stopped,
        )
        .await;
    }

    let had_idling = {
        let mut apps = idling_apps.lock().await;
        let had = !apps.is_empty();
        apps.clear();
        had
    };
    if had_idling {
        let agent_manager = app_handle.state::<AgentManager>();
        let idling_manager = app_handle.state::<IdlingManager>();
        let claims = app_handle.state::<idling::claims::IdleClaimsRegistry>();
        if let Err(e) = claims
            .replace_owner_claim(
                &app_handle,
                agent_manager,
                idling_manager,
                account.clone(),
                idling::claims::OWNER_ACHIEVEMENT_UNLOCKER,
                Vec::new(),
            )
            .await
        {
            tracing::warn!(steam_id, error = %e.code(), "achievement unlocker: failed to release idling on session end");
        }
    }

    {
        let mut s = state.lock().await;
        s.is_running = false;
        s.active.clear();
        s.scan_progress = None;
    }
    emit_state(&app_handle, &steam_id, &state).await;

    if matches!(end_reason, EndReason::QueueEmpty) {
        maybe_start_next_task(&app_handle, &account, &steam_id).await;
    }

    app_handle
        .state::<AchievementUnlockerManager>()
        .remove(&steam_id)
        .await;
    tracing::info!(steam_id, "achievement unlocker: session ended");
}
