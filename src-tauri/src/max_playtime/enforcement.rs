//! Background poll loop that force-stops a game the instant its total playtime crosses its
//! effective max-playtime cap while it's manually idling or auto-idling - the live-enforcement
//! half of `super`'s two effects (the other half, excluding an already-over-cap game from an
//! automatic queue, is each feature's own queue-building filter calling `settings::is_over_cap`
//! directly).
//!
//! **Scoped to `OWNER_MANUAL`/`OWNER_AUTO_IDLE` only - never achievement-unlocker/card-farming.**
//! Every owner claims idling through the shared `idling::claims::IdleClaimsRegistry`, but
//! achievement-unlocker and card-farming each also track their *own* active-game bookkeeping
//! outside that registry (`idling_apps`/`FarmingState::active`) and periodically re-announce their
//! own claim from that local state. A release from outside their own loop would get silently
//! undone by their very next re-announce, since their local state was never told the game stopped
//! - so those two instead run their own native max-playtime check inside their own loops
//! (`card_farming::manager::poll_active`'s `StopReason::MaxPlaytimeReached`,
//! `achievement_unlocker::manager::run_scan_phase`'s over-cap pre-check), each on their own
//! natural poll cadence. `OWNER_MANUAL`/`OWNER_AUTO_IDLE` have no such local state - the claims
//! registry *is* their whole state - so a release from here is never undone. This mirrors
//! `idling::auto_stop`'s identical scoping decision for the max-idle-time cap.
//!
//! **Estimates current playtime instead of asking Steam for it every tick.** The owned-games
//! cache (`games::cache`) only reflects the last `get_owned_games` fetch, not live playtime, and
//! re-fetching per app id every tick would mean a Web API call (CLI mode) or SteamKit2 round trip
//! (agent mode) every ~60s per actively-idling game for every signed-in account. Instead, the
//! first tick a game is observed idling records `cached_playtime + 0` as its baseline and starts
//! a wall-clock timer; every later tick estimates current playtime as `baseline + elapsed`. This
//! mirrors `idling::auto_stop`'s existing assumption that only this app's own idling drives a
//! game's playtime forward while a claim is active - already true today since idling is the only
//! thing keeping the game "running" for Steam's playtime-tracking purposes in the first place.

use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

use crate::games;
use crate::idling::claims::{IdleClaimsRegistry, OWNER_AUTO_IDLE, OWNER_MANUAL};
use crate::idling::IdlingManager;
use crate::steam_agent::AgentManager;

use super::settings;

const POLL_INTERVAL: Duration = Duration::from_secs(60);

struct TrackedGame {
    baseline_minutes: u64,
    started_at: Instant,
}

/// Spawned once, unconditionally, at app startup (`lib.rs`'s `.setup()`) via
/// `tauri::async_runtime::spawn` - runs for the app's whole lifetime, a cheap no-op tick whenever
/// nothing is currently manually/auto idling. Not gated behind a "started" guard like
/// `local_steam::commands::SteamStatusMonitor` since `.setup()` only ever runs once per launch,
/// unlike that monitor's frontend-mount-triggered start.
pub async fn run(app_handle: AppHandle) {
    // Keyed by (steam_id, owner, app_id) - the same game can be claimed by both owners at once
    // (see `idling::claims`'s module doc comment), each on its own independent baseline/timer,
    // exactly the same reasoning `idling::auto_stop::IdleAutoStopRegistry` keys its generations by.
    let mut tracked: HashMap<(String, &'static str, u32), TrackedGame> = HashMap::new();

    loop {
        tokio::time::sleep(POLL_INTERVAL).await;

        let claims = app_handle.state::<IdleClaimsRegistry>();
        let mut still_active: HashSet<(String, &'static str, u32)> = HashSet::new();

        for owner in [OWNER_MANUAL, OWNER_AUTO_IDLE] {
            for (account, steam_id, app_ids) in claims.active_claims_for_owner(owner).await {
                for app_id in app_ids {
                    let key = (steam_id.clone(), owner, app_id);
                    still_active.insert(key.clone());

                    let estimated_minutes = match tracked.get(&key) {
                        Some(game) => {
                            game.baseline_minutes + game.started_at.elapsed().as_secs() / 60
                        }
                        None => {
                            let baseline = cached_playtime_minutes(&app_handle, &steam_id, app_id);
                            tracked.insert(
                                key.clone(),
                                TrackedGame {
                                    baseline_minutes: baseline,
                                    started_at: Instant::now(),
                                },
                            );
                            baseline
                        }
                    };

                    let over_cap = match settings::is_over_cap(
                        &app_handle,
                        &steam_id,
                        app_id,
                        estimated_minutes,
                    )
                    .await
                    {
                        Ok(over_cap) => over_cap,
                        Err(e) => {
                            tracing::warn!(
                                steam_id,
                                owner,
                                app_id,
                                error = %e,
                                "max playtime: failed to check cap during enforcement poll, skipping this game this tick"
                            );
                            continue;
                        }
                    };

                    if !over_cap {
                        continue;
                    }

                    let agent_manager = app_handle.state::<AgentManager>();
                    let idling_manager = app_handle.state::<IdlingManager>();
                    match claims
                        .release_app_id_from_owner(
                            &app_handle,
                            agent_manager,
                            idling_manager,
                            account.clone(),
                            owner,
                            app_id,
                        )
                        .await
                    {
                        Ok(_) => {
                            tracing::info!(
                                steam_id,
                                owner,
                                app_id,
                                estimated_minutes,
                                "max playtime: auto-stopped (max playtime reached)"
                            );
                        }
                        Err(e) => {
                            tracing::warn!(
                                steam_id,
                                owner,
                                app_id,
                                error = %e,
                                "max playtime: auto-stop failed to release app id"
                            );
                        }
                    }
                    tracked.remove(&key);
                }
            }
        }

        // Drop tracking for any (steam_id, owner, app_id) that stopped idling since the last tick
        // (a normal stop, or an auto-stop from this same loop above) so a later re-claim starts a
        // fresh baseline read instead of resuming a stale elapsed timer.
        tracked.retain(|key, _| still_active.contains(key));
    }
}

/// Best-effort cached playtime lookup - falls back to `0` (never seen before) on any read
/// failure, same "don't let a cap-check quirk break the whole poll tick" resilience
/// `card_farming::settings::get_caps`'s `FarmingCaps::default()` fallback already applies.
fn cached_playtime_minutes(app_handle: &AppHandle, steam_id: &str, app_id: u32) -> u64 {
    match games::commands::get_owned_games_cache(app_handle.clone(), steam_id.to_string()) {
        Ok(cached_games) => cached_games
            .into_iter()
            .find(|g| g.app_id == app_id)
            .map(|g| g.playtime_forever_minutes)
            .unwrap_or(0),
        Err(e) => {
            tracing::warn!(
                steam_id,
                app_id,
                error = %e,
                "max playtime: failed to read owned-games cache for baseline playtime, assuming 0"
            );
            0
        }
    }
}
