//! Tracks which accounts have a library-wide achievement run (`commands::
//! set_all_owned_games_achievements`, the Debug tab's lock/unlock-everything actions) in flight.
//!
//! Exists so that run and the achievement unlocker (`achievement_unlocker::manager`) can refuse to
//! start while the other is running for the same account - both write achievement state for the
//! same games, so running them together would have the unlocker re-unlocking what a lock run just
//! locked (or racing an unlock run over the same achievements). Nothing else conflicts: idling and
//! card farming never touch achievement state.
//!
//! Keyed by resolved SteamID64, matching `AchievementUnlockerManager`'s own session keying, so the
//! two checks line up for both sign-in modes.

use std::collections::HashSet;
use std::sync::{Arc, Mutex};

#[derive(Default)]
pub struct LibraryRunRegistry {
    running: Arc<Mutex<HashSet<String>>>,
}

impl LibraryRunRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_running(&self, steam_id: &str) -> bool {
        self.lock().contains(steam_id)
    }

    /// Marks `steam_id` as running and returns a guard that clears it on drop, or `None` if a run
    /// is already in flight for that account. Clearing on drop (rather than an explicit `finish`)
    /// means an early `?` return or a cancelled command future can never leave the account stuck
    /// "running" until the app restarts.
    pub fn try_begin(&self, steam_id: &str) -> Option<LibraryRunGuard> {
        if !self.lock().insert(steam_id.to_string()) {
            return None;
        }
        Some(LibraryRunGuard {
            running: self.running.clone(),
            steam_id: steam_id.to_string(),
        })
    }

    // A std (not tokio) mutex - every critical section is a single non-async set operation, and a
    // std lock is what lets `LibraryRunGuard::drop` release synchronously. Poisoning is ignored:
    // the set stays structurally valid even if a holder panicked mid-operation.
    fn lock(&self) -> std::sync::MutexGuard<'_, HashSet<String>> {
        self.running.lock().unwrap_or_else(|e| e.into_inner())
    }
}

pub struct LibraryRunGuard {
    running: Arc<Mutex<HashSet<String>>>,
    steam_id: String,
}

impl Drop for LibraryRunGuard {
    fn drop(&mut self) {
        self.running
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(&self.steam_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn second_run_for_the_same_account_is_refused_until_the_first_guard_drops() {
        let registry = LibraryRunRegistry::new();
        let guard = registry.try_begin("1").expect("first run starts");
        assert!(registry.is_running("1"));
        assert!(registry.try_begin("1").is_none());
        // A different account is unaffected.
        assert!(registry.try_begin("2").is_some());

        drop(guard);
        assert!(!registry.is_running("1"));
        assert!(registry.try_begin("1").is_some());
    }
}
