//! Reconciles multiple independent "I want these games idling" callers (manual toggles from the
//! Games/Idling pages, auto-idle's startup trigger, achievement-unlocker, card farming) into one
//! announced idle set, instead of each caller full-replacing it with only its own games - the
//! daemon/`IdlingManager::set_games` only ever see "the desired set," never "the desired set *for
//! this owner*," so without this registry, whichever caller announced last would silently wipe out
//! every other owner's games. Each owner registers its own claim by name; the set actually
//! announced is always the union of every live claim.
//!
//! **Account-scoped**: claims are nested under the resolved SteamID64 they belong to, not a single
//! flat map shared by the whole app - otherwise one account's achievement-unlocker claim could get
//! unioned into a *different* account's announce, corrupting both accounts' idling state. The
//! account is resolved internally via [`crate::games::commands::resolve_steam_id`] so callers never
//! need to pass a pre-resolved id.
//!
//! **Known gaps, deliberately unfixed for now**: the CLI-mode background poller
//! (`idling::manager::run_poller`) has no way to drop an app id from this registry when its process
//! is killed externally (e.g. via Task Manager), so a later unrelated announce could resurrect it -
//! rare enough not to be worth the added coupling yet. `clear()` and
//! `updater::kill_all_steam_utility_processes` also still wipe every account's claims
//! unconditionally, which is correct for today's single-account frontend but will need a
//! genuinely per-account variant once multiple accounts can be signed in concurrently.

use std::collections::HashMap;

use tauri::{AppHandle, State};
use tokio::sync::Mutex;

use crate::error::AppResult;
use crate::games::commands::{resolve_steam_id, GamesAccount};
use crate::steam_agent::AgentManager;

use super::{cap_targets, commands::apply_idle_targets, IdleSetResult, IdleTarget, IdlingManager};

/// The Games/Idling pages' manual start/stop toggle and Stop All button.
pub const OWNER_MANUAL: &str = "manual";
/// The auto-idle feature's app-startup trigger and manual "Start Now" button.
pub const OWNER_AUTO_IDLE: &str = "auto_idle";
/// The achievement-unlocker automation loop's `idle: true` setting.
pub const OWNER_ACHIEVEMENT_UNLOCKER: &str = "achievement_unlocker";
/// The card-farming automation cycle.
pub const OWNER_CARD_FARMING: &str = "card_farming";

type OwnerClaims = HashMap<&'static str, HashMap<u32, String>>;

pub struct IdleClaimsRegistry {
    /// resolved SteamID64 -> owner -> {app_id: name}. A missing/empty owner entry means that
    /// owner currently wants nothing idling *for that account*; a missing account entry means no
    /// owner has ever claimed anything for it yet.
    claims: Mutex<HashMap<String, OwnerClaims>>,
    /// resolved SteamID64 -> the `GamesAccount` last seen claiming for it - lets
    /// `max_playtime::enforcement`'s poll loop re-derive the `GamesAccount` a release needs
    /// (agent mode's variant carries a `username`, not just the resolved SteamID64) without a
    /// second, separate account-resolution path of its own. Written alongside every
    /// [`Self::replace_owner_claim`] call, never removed - stale-but-present is harmless (a
    /// release for an account with no live claims is a no-op), and removing it on every claim
    /// clear would just mean re-populating it on the very next start.
    accounts: Mutex<HashMap<String, GamesAccount>>,
}

impl IdleClaimsRegistry {
    pub fn new() -> Self {
        Self {
            claims: Mutex::new(HashMap::new()),
            accounts: Mutex::new(HashMap::new()),
        }
    }

    /// Sets `owner`'s claim to exactly `targets` (empty clears it) for `account`, then announces
    /// the union of every owner's current claim *for that same account only*. Holds the lock
    /// across both the mutation and the actual announce call so two owners changing their claims
    /// at nearly the same time can't interleave and announce a stale union - each call's announce
    /// fully reflects its own mutation before the next one starts.
    pub async fn replace_owner_claim(
        &self,
        app_handle: &AppHandle,
        agent_manager: State<'_, AgentManager>,
        idling_manager: State<'_, IdlingManager>,
        account: GamesAccount,
        owner: &'static str,
        targets: Vec<IdleTarget>,
    ) -> AppResult<IdleSetResult> {
        let steam_id = resolve_steam_id(&account, &agent_manager).await?;
        self.accounts
            .lock()
            .await
            .insert(steam_id.clone(), account.clone());
        let mut claims = self.claims.lock().await;
        let account_claims = claims.entry(steam_id.clone()).or_default();
        if targets.is_empty() {
            account_claims.remove(owner);
        } else {
            account_claims.insert(
                owner,
                targets.into_iter().map(|t| (t.app_id, t.name)).collect(),
            );
        }
        let union = union_targets(account_claims);
        drop(claims);
        tracing::info!(
            steam_id,
            owner,
            count = union.len(),
            "idling: claim updated"
        );

        apply_idle_targets(
            app_handle.clone(),
            agent_manager,
            idling_manager,
            account,
            union,
        )
        .await
    }

    /// Removes `app_id` from every owner's claim *for `account`*, then announces the resulting
    /// union - backs an explicit single-game "stop" that should win regardless of which owner
    /// started that game, without touching any other account's claims.
    pub async fn release_app_id(
        &self,
        app_handle: &AppHandle,
        agent_manager: State<'_, AgentManager>,
        idling_manager: State<'_, IdlingManager>,
        account: GamesAccount,
        app_id: u32,
    ) -> AppResult<IdleSetResult> {
        let steam_id = resolve_steam_id(&account, &agent_manager).await?;
        let mut claims = self.claims.lock().await;
        let account_claims = claims.entry(steam_id.clone()).or_default();
        for owner_claims in account_claims.values_mut() {
            owner_claims.remove(&app_id);
        }
        account_claims.retain(|_, owner_claims| !owner_claims.is_empty());
        let union = union_targets(account_claims);
        drop(claims);
        tracing::info!(steam_id, app_id, "idling: released app id from all owners");

        apply_idle_targets(
            app_handle.clone(),
            agent_manager,
            idling_manager,
            account,
            union,
        )
        .await
    }

    /// Bulk version of the manual start/stop toggle - decides start-vs-stop **per app id**
    /// (mirrors `toggle_manual_idle`'s single-game decision: claimed by any owner means stop,
    /// clearing every owner; unclaimed means start, added to `"manual"`), all under one lock hold
    /// so a mixed selection (some already idling, some not) resolves correctly in a single
    /// announce instead of one call per game - see the multi-select context menu's bulk "start/stop
    /// idling" action. Returns which app ids ended up newly-started vs newly-stopped so the caller
    /// can schedule/bump auto-stop timers for exactly those, mirroring what the single-game
    /// `toggle_manual_idle` command does after its own start/stop branch.
    pub async fn toggle_manual_bulk(
        &self,
        app_handle: &AppHandle,
        agent_manager: State<'_, AgentManager>,
        idling_manager: State<'_, IdlingManager>,
        account: GamesAccount,
        targets: Vec<IdleTarget>,
    ) -> AppResult<(IdleSetResult, Vec<u32>, Vec<u32>)> {
        let steam_id = resolve_steam_id(&account, &agent_manager).await?;
        self.accounts
            .lock()
            .await
            .insert(steam_id.clone(), account.clone());
        let mut claims = self.claims.lock().await;
        let account_claims = claims.entry(steam_id.clone()).or_default();

        let mut started = Vec::new();
        let mut stopped = Vec::new();
        for IdleTarget { app_id, name } in targets {
            let claimed_elsewhere = account_claims
                .values()
                .any(|owner_claims| owner_claims.contains_key(&app_id));
            if claimed_elsewhere {
                for owner_claims in account_claims.values_mut() {
                    owner_claims.remove(&app_id);
                }
                stopped.push(app_id);
            } else {
                account_claims
                    .entry(OWNER_MANUAL)
                    .or_default()
                    .insert(app_id, name);
                started.push(app_id);
            }
        }
        account_claims.retain(|_, owner_claims| !owner_claims.is_empty());
        let union = union_targets(account_claims);
        drop(claims);
        tracing::info!(
            steam_id,
            started = started.len(),
            stopped = stopped.len(),
            "idling: bulk manual toggle"
        );

        let result = apply_idle_targets(
            app_handle.clone(),
            agent_manager,
            idling_manager,
            account,
            union,
        )
        .await?;

        Ok((result, started, stopped))
    }

    /// Removes `app_id` from only `owner`'s claim *for `account`*, then announces the resulting
    /// union - backs `idling::auto_stop`'s per-owner max-idle-time timer, so a game idling under
    /// more than one owner at once (e.g. manually started while also sitting in the auto-idle
    /// queue) only actually stops once every owner claiming it has either timed out or been
    /// explicitly stopped, rather than one owner's timer prematurely evicting another owner's
    /// still-active claim on the same game (unlike [`Self::release_app_id`], which is an explicit
    /// user "stop" and correctly clears every owner regardless).
    pub async fn release_app_id_from_owner(
        &self,
        app_handle: &AppHandle,
        agent_manager: State<'_, AgentManager>,
        idling_manager: State<'_, IdlingManager>,
        account: GamesAccount,
        owner: &str,
        app_id: u32,
    ) -> AppResult<IdleSetResult> {
        let steam_id = resolve_steam_id(&account, &agent_manager).await?;
        let mut claims = self.claims.lock().await;
        let account_claims = claims.entry(steam_id.clone()).or_default();
        if let Some(owner_claims) = account_claims.get_mut(owner) {
            owner_claims.remove(&app_id);
            if owner_claims.is_empty() {
                account_claims.remove(owner);
            }
        }
        let union = union_targets(account_claims);
        drop(claims);
        tracing::info!(
            steam_id,
            owner,
            app_id,
            "idling: released app id from one owner (max idle time reached)"
        );

        apply_idle_targets(
            app_handle.clone(),
            agent_manager,
            idling_manager,
            account,
            union,
        )
        .await
    }

    /// Empties one owner's claim *for `account`* only (leaving every other owner's claim intact)
    /// and announces the resulting union - backs a per-section "stop" on the Idling page for
    /// owners with no automation loop of their own to reuse a stop command from (`"manual"`,
    /// `"auto_idle"`). Card-farming/achievement-unlocker's per-section stop instead reuses their
    /// existing `stop_farming`/`stop_achievement_unlocker` commands, which already release their
    /// claim as part of stopping their session loop - see this module's doc comment.
    pub async fn clear_owner(
        &self,
        app_handle: &AppHandle,
        agent_manager: State<'_, AgentManager>,
        idling_manager: State<'_, IdlingManager>,
        account: GamesAccount,
        owner: &str,
    ) -> AppResult<IdleSetResult> {
        let steam_id = resolve_steam_id(&account, &agent_manager).await?;
        let mut claims = self.claims.lock().await;
        let account_claims = claims.entry(steam_id.clone()).or_default();
        account_claims.remove(owner);
        let union = union_targets(account_claims);
        drop(claims);
        tracing::info!(steam_id, owner, "idling: cleared one owner's claim");

        apply_idle_targets(
            app_handle.clone(),
            agent_manager,
            idling_manager,
            account,
            union,
        )
        .await
    }

    /// Empties every owner's claim *for `account` only* and announces an empty set - backs "Stop
    /// All" for the currently-viewed account. Other accounts' claims are untouched.
    pub async fn clear_all(
        &self,
        app_handle: &AppHandle,
        agent_manager: State<'_, AgentManager>,
        idling_manager: State<'_, IdlingManager>,
        account: GamesAccount,
    ) -> AppResult<IdleSetResult> {
        let steam_id = resolve_steam_id(&account, &agent_manager).await?;
        self.claims.lock().await.remove(&steam_id);
        tracing::info!(steam_id, "idling: cleared all claims");
        apply_idle_targets(
            app_handle.clone(),
            agent_manager,
            idling_manager,
            account,
            Vec::new(),
        )
        .await
    }

    /// Wipes every account's claims without announcing anything - used when the processes those
    /// claims refer to are already being torn down some other way for the whole app (pre-update
    /// cleanup). Deliberately still whole-app, not per-account - see this module's doc comment.
    pub async fn clear(&self) {
        self.claims.lock().await.clear();
    }

    /// The current full `{app_id: name}` membership of one owner's claim *for `account`* - used by
    /// `toggle_manual_idle` to preserve the names of every other game already in the `"manual"`
    /// claim when adding one more.
    pub async fn owner_claim(
        &self,
        agent_manager: &AgentManager,
        account: &GamesAccount,
        owner: &str,
    ) -> AppResult<HashMap<u32, String>> {
        let steam_id = resolve_steam_id(account, agent_manager).await?;
        Ok(self
            .claims
            .lock()
            .await
            .get(&steam_id)
            .and_then(|account_claims| account_claims.get(owner))
            .cloned()
            .unwrap_or_default())
    }

    /// Whether *any* owner currently claims `app_id` *for `account`* - used by
    /// `toggle_manual_idle` to decide whether a click on a game's idle toggle means "start it" or
    /// "stop it regardless of who started it," rather than only checking the `"manual"` claim.
    pub async fn is_claimed(
        &self,
        agent_manager: &AgentManager,
        account: &GamesAccount,
        app_id: u32,
    ) -> AppResult<bool> {
        let steam_id = resolve_steam_id(account, agent_manager).await?;
        Ok(self
            .claims
            .lock()
            .await
            .get(&steam_id)
            .is_some_and(|account_claims| {
                account_claims
                    .values()
                    .any(|owner_claims| owner_claims.contains_key(&app_id))
            }))
    }

    /// Every account with a currently-claimed app id under `owner`, as `(account, steam_id,
    /// app_ids)` - the one sweep `max_playtime::enforcement`'s poll loop needs each tick, without
    /// needing to already know which accounts are live. **Scoped to one `owner` at a time**
    /// (rather than the full cross-owner union `claims_by_owner`/`union_targets` compute) because
    /// only `OWNER_MANUAL`/`OWNER_AUTO_IDLE` have no bookkeeping of their own outside this
    /// registry - achievement-unlocker/card-farming each track their own active-game state
    /// (`idling_apps`/`active`) and would silently re-add a game this registry released on their
    /// very next claim update if a release bypassed that state, so those two owners run their own
    /// native max-playtime check inside their own loops instead (see
    /// `card_farming::manager::poll_active`/`achievement_unlocker::manager`'s scan phase) - see
    /// `max_playtime::enforcement`'s module doc comment for the full reasoning. An account whose
    /// last-known [`GamesAccount`] was never recorded (a claim replace has never happened) is
    /// skipped rather than panicking - can't happen in practice since a nonempty claim only ever
    /// exists after [`Self::replace_owner_claim`] already recorded it, but the poll loop still
    /// shouldn't crash the whole app on that invariant if it's ever wrong.
    pub async fn active_claims_for_owner(
        &self,
        owner: &str,
    ) -> Vec<(GamesAccount, String, Vec<u32>)> {
        let claims = self.claims.lock().await;
        let accounts = self.accounts.lock().await;
        claims
            .iter()
            .filter_map(|(steam_id, account_claims)| {
                let owner_claims = account_claims.get(owner)?;
                if owner_claims.is_empty() {
                    return None;
                }
                let account = accounts.get(steam_id)?.clone();
                Some((
                    account,
                    steam_id.clone(),
                    owner_claims.keys().copied().collect(),
                ))
            })
            .collect()
    }

    /// Every owner's current set of claimed app ids *for `account`*, owners with an empty claim
    /// omitted - lets the frontend group the Idling page by originating feature.
    /// `union_targets` already discards this info when building the announced set; this is the
    /// one place it survives to be read back out.
    pub async fn claims_by_owner(
        &self,
        agent_manager: &AgentManager,
        account: &GamesAccount,
    ) -> AppResult<HashMap<String, Vec<u32>>> {
        let steam_id = resolve_steam_id(account, agent_manager).await?;
        Ok(self
            .claims
            .lock()
            .await
            .get(&steam_id)
            .map(|account_claims| {
                account_claims
                    .iter()
                    .filter(|(_, apps)| !apps.is_empty())
                    .map(|(owner, apps)| (owner.to_string(), apps.keys().copied().collect()))
                    .collect()
            })
            .unwrap_or_default())
    }
}

/// Dedups by `app_id` (first-seen owner wins the name) and caps at
/// [`super::MAX_CONCURRENT_GAMES`] via the existing [`cap_targets`] - operates on one account's
/// own owner claims only, never the whole registry.
fn union_targets(account_claims: &OwnerClaims) -> Vec<IdleTarget> {
    let merged = account_claims.values().flat_map(|owner_claims| {
        owner_claims.iter().map(|(app_id, name)| IdleTarget {
            app_id: *app_id,
            name: name.clone(),
        })
    });
    cap_targets(merged.collect())
}
