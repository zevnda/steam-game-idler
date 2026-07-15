//! Steam "free games" discovery + claiming. Discovery is mode-agnostic (an anonymous store-page
//! scrape, no account concept at all - see `discovery.rs`); claiming genuinely differs per sign-in
//! mode:
//!
//! - Agent mode claims via SteamKit2's `SteamApps.RequestFreeLicense` first (a real Steam-network
//!   license grant, no cookies needed at all - see `steam_agent::AgentManager::request_free_license`
//!   and `libs/SteamUtility/Daemon/Bot/FreeLicenseManager.cs`), falling back to the same store-page
//!   claim CLI mode uses (below) - cookie-primed from the live SteamKit2 session, no interactive
//!   login - for the promo packages that opcode can't grant directly.
//! - CLI mode has no `RequestFreeLicense` equivalent in the Steamworks.NET SDK surface at all, so it
//!   always uses a cookie-authenticated hidden-webview click against the store page itself - see
//!   `local_steam::free_game_claim`.
//!
//! One command surface (`commands::claim_free_game`) branches internally on `GamesAccount`, not a
//! pair of mode-specific commands.

pub mod commands;
mod discovery;
pub mod settings;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreeGameEntry {
    pub app_id: u32,
    pub name: String,
}

/// Outcome of a claim attempt, shared by both sign-in modes despite their different mechanics.
/// CLI mode has no reliable way to distinguish `AlreadyOwned` from a successful click (the "Add to
/// Account" button simply isn't present either way) - it only ever reports `Granted` or `Failed`,
/// an accepted, documented gap rather than something faked to look symmetric with agent mode.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "outcome"
)]
pub enum FreeGameClaimOutcome {
    Granted,
    AlreadyOwned,
    Failed { reason: String },
}

/// Emitted when a store-page claim's background tail recheck (see
/// `local_steam::free_game_claim::claim_via_store_page`'s doc comment) later confirms a game was
/// actually granted after its synchronous polling window had already given up and reported
/// `Failed`. Fires for both sign-in modes - agent mode's `RequestFreeLicense` fast path itself
/// never needs one (a single synchronous SteamKit2 round trip, no propagation lag), but its
/// store-page fallback (`AgentManager::request_free_license`, `claim_via_agent_session`) has the
/// exact same propagation-lag ambiguity CLI mode's claim always has.
pub const FREE_GAME_CLAIM_CORRECTED_EVENT: &str = "free-game-claim-corrected";

/// Tagged the same way as `games::commands::GamesAccount` so the frontend can match a correction
/// back to the right signed-in account - agent-mode accounts have no SteamID64 on the frontend at
/// all (see `useGamesListSync.ts`'s doc comment), only `username`, so `steam_id` alone can't be
/// used to identify the account universally the way it can for CLI mode.
#[derive(Debug, Clone, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "mode"
)]
pub enum FreeGameClaimCorrection {
    Agent { username: String, app_id: u32 },
    Local { steam_id: String, app_id: u32 },
}
