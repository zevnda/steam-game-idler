//! "Max idle time" auto-stop - the Game Settings tab's global/per-game caps
//! (`super::settings::effective_max_idle_time`) actually taking effect. Lives at the
//! `idling::claims` layer rather than per-backend: both CLI-mode and agent-mode idling already
//! converge on [`super::claims::IdleClaimsRegistry`], so one backend-agnostic timer that releases
//! the app id the same way a manual "stop" click already does covers both sign-in modes with no
//! daemon/process-specific code of its own.
//!
//! **Deliberately covers `OWNER_MANUAL` and `OWNER_AUTO_IDLE` only, never achievement-unlocker/
//! card-farming's own idle claims** - mirrors `main`'s own scoping (`handleIdle.ts::startIdle`'s
//! `manual && maxIdleTime > 0` guard) for manual idling, widened to also cover auto-idle since both
//! are "just idling" from the user's perspective (unlike achievement-unlocker/card-farming, which
//! have their own separate, purpose-built auto-stop caps). This module has no opinion on that scope
//! itself - it's implied by only ever being called from `commands::toggle_manual_idle` and
//! `auto_idle::commands::start_auto_idle_games`, never from achievement-unlocker/card-farming's own
//! claim-replacing call sites.
//!
//! **Correctness via a generation counter, not cancel handles.** Every start/stop for a given
//! `(steam_id, app_id, owner)` bumps that triple's generation. A scheduled timer captures its
//! generation at spawn time and only acts if the generation is still current when it wakes - so a
//! stop, or a fresh restart, before the deadline silently invalidates the stale timer with no
//! explicit cancellation needed. Simpler than tracking `AbortHandle`s per triple, and correct under
//! the same "last write wins" reasoning `IdleClaimsRegistry` itself already uses. **Keyed by owner,
//! not just `(steam_id, app_id)`**: the same game can be claimed by both `"manual"` and `"auto_idle"`
//! at once, each on its own independent timer - sharing one counter across owners would let one
//! owner's start silently invalidate the other's already-running timer.

use std::collections::HashMap;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

use crate::error::AppResult;
use crate::games::commands::GamesAccount;
use crate::steam_agent::AgentManager;

use super::claims::IdleClaimsRegistry;
use super::{settings, IdlingManager};

#[derive(Default)]
pub struct IdleAutoStopRegistry {
    generations: Mutex<HashMap<(String, u32, &'static str), u64>>,
}

impl IdleAutoStopRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Bumps and returns the new generation for `(steam_id, app_id, owner)` - invalidates any timer
    /// already scheduled for that triple. Safe to call even when nothing was ever scheduled for it.
    pub async fn bump(&self, steam_id: &str, app_id: u32, owner: &'static str) -> u64 {
        let mut generations = self.generations.lock().await;
        let entry = generations
            .entry((steam_id.to_string(), app_id, owner))
            .or_insert(0);
        *entry += 1;
        *entry
    }

    async fn current_generation(&self, steam_id: &str, app_id: u32, owner: &'static str) -> u64 {
        self.generations
            .lock()
            .await
            .get(&(steam_id.to_string(), app_id, owner))
            .copied()
            .unwrap_or(0)
    }

    /// Called right after a manual or auto-idle start succeeds for `app_id` under `owner`. Always
    /// bumps the generation first (even when the effective cap turns out to be `None`), so a
    /// previous start's now-stale timer - e.g. the cap was removed between that start and this one -
    /// can never fire against this new session. Spawns nothing if idling is uncapped for this
    /// account/app id.
    pub async fn schedule_if_capped(
        &self,
        app_handle: &AppHandle,
        steam_id: &str,
        app_id: u32,
        owner: &'static str,
        account: GamesAccount,
    ) -> AppResult<()> {
        let generation = self.bump(steam_id, app_id, owner).await;
        let Some(minutes) = settings::effective_max_idle_time(app_handle, steam_id, app_id).await?
        else {
            return Ok(());
        };

        let app_handle = app_handle.clone();
        let steam_id = steam_id.to_string();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_secs(u64::from(minutes) * 60)).await;

            let registry = app_handle.state::<IdleAutoStopRegistry>();
            if registry.current_generation(&steam_id, app_id, owner).await != generation {
                // Superseded by a later start or an explicit stop - nothing to do.
                return;
            }

            let agent_manager = app_handle.state::<AgentManager>();
            let idling_manager = app_handle.state::<IdlingManager>();
            let claims = app_handle.state::<IdleClaimsRegistry>();
            match claims
                .release_app_id_from_owner(
                    &app_handle,
                    agent_manager,
                    idling_manager,
                    account,
                    owner,
                    app_id,
                )
                .await
            {
                Ok(_) => {
                    tracing::info!(
                        app_id,
                        steam_id,
                        owner,
                        minutes,
                        "idling: auto-stopped (max idle time reached)"
                    );
                }
                Err(e) => {
                    tracing::warn!(app_id, steam_id, owner, error = %e.code(), "idling: auto-stop failed to release app id");
                }
            }
        });

        Ok(())
    }
}
