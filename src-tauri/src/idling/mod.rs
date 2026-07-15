//! Idling: starting/stopping Steam games so playtime accrues, behind one command surface for both
//! sign-in modes (`commands::toggle_manual_idle`/`commands::stop_all_idling`/
//! `commands::get_idle_state`) - see `commands.rs`/`manager.rs` for the CLI-mode process-owning
//! half, and `steam_agent::manager::AgentManager::set_idle_games` for the agent-mode
//! daemon-announcement half. `claims.rs` sits in front of the frontend-facing commands and
//! reconciles every independent caller (manual toggles, auto-idle, achievement-unlocker, card
//! farming) into one announced set - see its module doc comment.
//!
//! The two backends genuinely differ in shape (one OS process per game locally vs. one
//! `idle_set` announcement covering up to 32 games for the daemon), so this module's job is
//! reconciling that behind one shared request/response/event shape rather than picking one
//! backend's model and forcing the other into it.

pub mod auto_stop;
pub mod claims;
pub mod commands;
pub mod manager;
pub mod settings;

use serde::{Deserialize, Serialize};

pub use manager::IdlingManager;

/// One requested idling target. `name` is only meaningful to CLI mode (it becomes the hidden
/// `idle` process's window title - see `manager::IdlingManager::set_games`); agent mode ignores
/// it. Sent uniformly by the frontend regardless of sign-in mode so it never has to decide
/// whether a name is needed for a given call.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdleTarget {
    pub app_id: u32,
    pub name: String,
}

/// Result of a `set_idle_games` call. `failures` is only ever non-empty for CLI mode - the daemon
/// has no per-game failure concept, since `idle_set` is a single announcement, not N independent
/// process spawns.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IdleSetResult {
    pub app_ids: Vec<u32>,
    pub failures: Vec<IdleFailure>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IdleFailure {
    pub app_id: u32,
    pub error: String,
}

/// Tauri event both backends emit into so the frontend needs exactly one `listen()` call for
/// "what's currently idling changed," regardless of sign-in mode - mirrors what `GamesAccount`
/// already does for commands, extended to events. Payload is `{"appIds": [u32, ...]}` plus, for
/// agent mode only, an `"account"` field carrying the username (see
/// `steam_agent::process::handle_line`'s `idle_state` handling) so the frontend can distinguish
/// which of several concurrently-signed-in agent accounts an event belongs to.
/// **Deliberately still omitted for CLI mode**: the real local Steam client can only ever be
/// logged into one account at a time, so a CLI-mode emission is genuinely unambiguous without one.
pub const IDLE_STATE_EVENT: &str = "idling-state-changed";

/// Steam only reports up to 32 concurrently-"played" games per connection - a real protocol
/// limit (see `Daemon/Bot/IdlingManager.cs`'s `MaxConcurrentGames`), not a daemon-only quirk, so
/// CLI mode is capped the same way for consistent behavior at the boundary.
const MAX_CONCURRENT_GAMES: usize = 32;

/// Dedup (preserving first-seen order) and cap to [`MAX_CONCURRENT_GAMES`], mirroring
/// `IdlingManager.cs`'s `appIds.Distinct().Take(MaxConcurrentGames)` exactly.
pub fn cap_app_ids(ids: impl IntoIterator<Item = u32>) -> Vec<u32> {
    cap_by_key(ids, |id| *id)
}

/// Same dedup+cap as [`cap_app_ids`], keyed by `app_id`, for CLI mode's richer `IdleTarget` list
/// (which also carries a `name` `cap_app_ids` alone would discard).
pub fn cap_targets(targets: Vec<IdleTarget>) -> Vec<IdleTarget> {
    cap_by_key(targets, |t| t.app_id)
}

fn cap_by_key<T>(items: impl IntoIterator<Item = T>, key: impl Fn(&T) -> u32) -> Vec<T> {
    let mut seen = std::collections::HashSet::new();
    let mut result = Vec::new();
    for item in items {
        if seen.insert(key(&item)) {
            result.push(item);
            if result.len() == MAX_CONCURRENT_GAMES {
                break;
            }
        }
    }
    result
}
