//! Steam "free games" discovery + claiming. Discovery is mode-agnostic (an anonymous store-page
//! scrape, no account concept at all - see `discovery.rs`), and by construction only ever surfaces
//! ordinary paid games temporarily discounted to 100% off (`discovery.rs`'s scrape filters on
//! `specials=1`), never a genuine evergreen "Free on Demand" title.
//!
//! Both sign-in modes claim the same way: a direct authenticated POST to
//! `store.steampowered.com/freelicense/addfreelicense/{subId}` - the same endpoint the store
//! website's own "Add to Cart"/claim button drives - via `store_claim::claim_via_direct_post`.
//! SteamKit2's `SteamApps.RequestFreeLicense` opcode is deliberately never attempted for this
//! feature: it only grants genuine Free-on-Demand packages, which - per this module's own scrape
//! filter above - is never what gets claimed here; see
//! `steam_agent::AgentManager::claim_free_game`'s doc comment for the confirmation behind that.
//!
//! - Agent mode derives fresh session cookies on demand from the live SteamKit2 connection, no
//!   webview or interactive login ever needed - see `steam_agent::AgentManager::get_web_session`.
//! - CLI mode has no way to derive a web session other than a real interactive login (Steamworks.NET
//!   has no such API surface) - `local_steam::free_game_claim::ensure_store_session` shows this
//!   once per account, persisting cookies for every claim after that. See that module's doc comment
//!   for how the persisted session is kept fresh without ever re-showing that window.
//!
//! One command surface (`commands::claim_free_game`) branches internally on `GamesAccount`, not a
//! pair of mode-specific commands.

pub mod commands;
mod discovery;
pub mod settings;
pub mod store_claim;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreeGameEntry {
    pub app_id: u32,
    pub name: String,
}

/// Outcome of a claim attempt, shared by both sign-in modes. Both modes now resolve `AlreadyOwned`
/// via an upfront authenticated ownership check (`store_claim::claim_via_direct_post`'s pre-check)
/// before ever attempting the claim POST - CLI mode's former webview-click flow had no reliable way
/// to distinguish this from a successful click and only ever reported `Granted`/`Failed`; that gap
/// is closed now that claiming no longer depends on reading anything back from a rendered page.
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

/// Emitted when a claim's background tail recheck (see
/// `store_claim::claim_via_direct_post`'s doc comment) later confirms a game was actually granted
/// after its synchronous confirmation window had already given up and reported `Failed` - the
/// direct claim POST's own response is known to be unreliable (see `store_claim`'s module doc
/// comment), so this stays the safety net for both sign-in modes.
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
