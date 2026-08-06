//! Card farming: an automatic two-phase cycle. Every outer-loop iteration re-scrapes the account's
//! games-with-drops list, classifies each into "ready" (playtime past
//! `settings::CardFarmingSettings::hours_until_farmable`) or "accumulating" (not yet), and picks
//! exactly one phase to run - never both at once, since idling anything else alongside a
//! drops-eligible game collapses its drop rate. Ready games are solo-farmed one at a time (fewest
//! drops remaining first) unless `allow_multi_game_farming` is on; accumulating games are bulk-idled
//! together, prioritizing whichever are closest to the threshold when there are more than
//! `manager::MAX_CONCURRENT_FARMING` of them. Both phases run through the same restart-cycle helper
//! (`manager::run_restart_cycle`): idle the target(s), stop, a short pause, an individual sweep of
//! every target, stop, then the outer loop reclassifies. Calls
//! `idling::claims::IdleClaimsRegistry::replace_owner_claim` directly rather than duplicating
//! process-management logic - this module owns no process/spawn logic of its own.
//!
//! **Blacklist** ([`blacklist`]) permanently excludes a game from ever being farmed. **Whitelist**
//! ([`whitelist`]) is the opposite kind of lever, and a different kind of control entirely: when
//! non-empty, it *restricts scope* to just its members (nothing else is considered while any member
//! remains) but never affects *ordering* - the phase/tie-break rules above still decide what
//! happens within that restricted pool, exactly as they do for the full library. The app prunes the
//! whitelist automatically (any member that becomes ineligible for any reason is removed and
//! reported with a precise reason) - the user only ever adds to it.
//!
//! **Separate infrastructure from `steam_agent`/`local_steam`, but not capability-uniform between
//! them.** Card drops are detected via cookie-authenticated Steam Community scraping
//! (`sessionid`/`steamLoginSecure`/`steamMachineAuth{steamId}`), unrelated to either sign-in
//! backend's own session/auth - both modes need the same Community cookies, so `scraper.rs` never
//! branches on `Agent`/`Local`. How those cookies get acquired *does* differ per mode: agent mode's
//! daemon already holds a live SteamKit2 connection that can mint web-session cookies directly with
//! no webview shown; CLI mode has no live network session, so it still needs a hidden webview.
//! `SteamCookies` and the cookie-resolution logic live in the crate-level `steam_community` module
//! (re-exported below) since `inventory` needs the exact same mechanism for its own market pages.
//! `session::resolve` is where the acquire-vs-derive-vs-manual branch lives - `commands.rs` passes
//! the full `GamesAccount` into it so it can make that choice.
//!
//! **Pro-tier split**: automatic cookie retrieval is gated behind `hasGamerAccess`, while manual
//! cookie paste stays available to every tier. Both commands below take an optional
//! `manual_cookies` alongside `account` - when supplied, [`session::resolve`] never touches the
//! automatic path (no Rust-side tier check needed - gating lives at the frontend call site); when
//! omitted, `resolve` picks the automatic path for the account's sign-in mode.

pub mod blacklist;
pub mod commands;
pub mod manager;
mod refund_window;
mod scraper;
pub mod settings;
pub mod whitelist;

use serde::Serialize;

pub use crate::steam_community::{session, SteamCookies};
pub use blacklist::CardFarmingBlacklistEntry;
pub use manager::CardFarmingManager;
pub use whitelist::CardFarmingWhitelistEntry;

/// Emitted whenever a farming cycle's tracked state changes (started, moved to the next phase,
/// remaining-drops count updated, stopped) - mirrors `idling::IDLE_STATE_EVENT`'s "one event, no
/// per-mode variant" shape, even though card farming itself has no per-backend split (see this
/// module's doc comment above). Payload is `{"steamId": "...", "state": FarmingState}`.
pub const FARMING_STATE_EVENT: &str = "card-farming-state-changed";

/// Card drops remaining for one game, scraped from that game's own badge page overview entry.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameWithDrops {
    pub app_id: u32,
    pub name: String,
    pub remaining: u32,
    pub playtime_hours: f32,
}

/// Which phase the cycle is currently running - see this module's doc comment. Never both at once.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Phase {
    /// Solo- (or, with `allow_multi_game_farming` on, multi-) farming one or more games that have
    /// already crossed `hours_until_farmable` and have real card drops remaining.
    ReadyFarm,
    /// Bulk-idling a batch of games that haven't crossed `hours_until_farmable` yet, purely to
    /// accrue playtime toward it.
    BulkIdle,
}

/// Why a game left the cycle's tracking - surfaced on [`CompletedFarm`] so the "session finished"
/// summary can explain what happened to a game that's no longer being farmed, whether or not it was
/// ever actually a whitelist member. A manual per-game stop (Idling page) never produces one of
/// these - that's a deliberate user action, not something that needs explaining.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CompletedFarmReason {
    /// Card drops remaining hit zero after being actively farmed this session - a genuine finish.
    DropsExhausted,
    /// Never had any real card drops to begin with (only reachable for a whitelist member that
    /// turns out ineligible immediately, since the general candidate pool is built directly from
    /// games that already have drops).
    NoDropsRemaining,
    /// Still inside Steam's refund window per
    /// `settings::CardFarmingSettings::skip_refundable_games`
    /// (`refund_window::farmable_at_if_in_refund_window`) - only reported (and pruned from the
    /// whitelist) for a whitelist member; a general-pool game hitting this just quietly isn't
    /// considered, since it was never something the user explicitly opted into.
    RefundWindow,
    /// Hit `settings::CardFarmingSettings::skip_no_playtime` - has zero recorded playtime while
    /// that setting is on. Whitelist-only reporting, same reasoning as `RefundWindow`.
    SkippedUnplayed,
    /// Hit `settings::CardFarmingSettings::farm_unplayed_only` - has real recorded playtime while
    /// that setting restricts farming to unplayed games only. Whitelist-only reporting, same
    /// reasoning as `RefundWindow`.
    SkippedPlayed,
}

/// One game a farming cycle stopped tracking this session, tagged with why.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedFarm {
    pub app_id: u32,
    pub name: String,
    /// Real remaining count at the time this was reported - `0` for `DropsExhausted`/
    /// `NoDropsRemaining`, the actual remaining count for every other reason (a filter-based
    /// exclusion doesn't mean the drops are gone, just that this session won't chase them).
    pub remaining: u32,
    pub reason: CompletedFarmReason,
    /// Only `Some` when `reason` is [`CompletedFarmReason::RefundWindow`] - unix seconds after
    /// which this game is expected to exit Steam's refund window based on its purchase date, so the
    /// frontend can tell the user *when* it'll resume rather than just that it's paused.
    pub farmable_at: Option<i64>,
}

/// One farming cycle's full state - what `get_farming_state`/[`FARMING_STATE_EVENT`] return.
/// `active`/`queue`/`completed` only ever reflect *this* cycle's own bookkeeping, not a persisted
/// list - once a cycle ends (stopped or nothing left eligible) its session is dropped entirely, so a
/// later `get_farming_state` call for the same account reads back `FarmingState::default()`.
#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FarmingState {
    pub is_farming: bool,
    /// Which phase produced `active` - `None` only when the cycle isn't running at all.
    pub phase: Option<Phase>,
    /// The current phase's target(s) - one game (solo ready-farm), several (multi-game ready-farm
    /// or bulk-idle), republished once per outer-loop iteration. The restart-cycle's own internal
    /// stop/pause/restart choreography deliberately never surfaces here - see
    /// `manager::run_restart_cycle`'s doc comment.
    pub active: Vec<FarmingProgress>,
    /// Every other currently-eligible game not selected as a target this iteration - either still
    /// accumulating playtime, or a ready game that lost the fewest-remaining tie-break.
    pub queue: Vec<GameWithDrops>,
    pub completed: Vec<CompletedFarm>,
    /// Set once by `manager::run_cycle` on a definitive mid-cycle Steam Community session expiry
    /// (see `AppError::SteamCommunitySessionExpired`) - a hard stop, since every active game shares
    /// the same cookies: one expiring means all of them are dead.
    pub session_expired: bool,
}

/// One game in [`FarmingState::active`], with a live `remaining` count updated as the cycle polls.
/// `initial_remaining` is carried alongside purely for frontend progress display (e.g. "3 of 5
/// drops left") - no cycle logic depends on it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FarmingProgress {
    pub app_id: u32,
    pub name: String,
    pub initial_remaining: u32,
    pub remaining: u32,
    pub playtime_hours: f32,
    /// Unix millis when this game most recently entered `active` and has stayed continuously
    /// present there since - deliberately untouched by the restart-cycle's own internal stop/pause/
    /// restart (that choreography happens entirely below the once-per-outer-iteration granularity
    /// this field is stamped at), only reset if the game genuinely leaves `active` (drops back to
    /// `queue`) and later re-enters. Exists specifically so the frontend's on-card idling timer -
    /// which has no backend timestamp of its own and resets on any observed gap in the raw idle
    /// state - can stay accurate despite this feature's real, repeated stop/restarts under the hood.
    pub active_since: i64,
}
