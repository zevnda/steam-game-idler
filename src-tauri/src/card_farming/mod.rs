//! Card farming: idles up to 32 games with drops remaining concurrently (a real Steam protocol
//! limit, see `idling::MAX_CONCURRENT_GAMES`), polls each one's remaining count, drops finished
//! games out of the active set and backfills more from the queue as slots free up, repeating until
//! none are left. Calls `idling::claims::IdleClaimsRegistry::replace_owner_claim`/
//! `idling::commands::get_idle_state` directly rather than duplicating process-management logic.
//!
//! **Blacklist** ([`blacklist`]) is wired into both `commands::get_games_with_drops`'s browse
//! results and `commands::start_farming`'s queued set, so a blacklisted game can never be farmed.
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
pub mod queue;
mod scraper;
pub mod settings;

use serde::{Deserialize, Serialize};

pub use crate::steam_community::{session, SteamCookies};
pub use blacklist::CardFarmingBlacklistEntry;
pub use manager::CardFarmingManager;

/// Emitted whenever a farming cycle's tracked state changes (started, moved to the next game,
/// remaining-drops count updated, stopped) - mirrors `idling::IDLE_STATE_EVENT`'s "one event, no
/// per-mode variant" shape, even though card farming itself has no per-backend split (see this
/// module's doc comment above). Payload is `{"steamId": "...", "state": FarmingState}`.
pub const FARMING_STATE_EVENT: &str = "card-farming-state-changed";

/// How often the farming cycle re-checks the currently-idling game's remaining drop count. A real
/// card drop happens roughly once per ~30 min of accumulated playtime, not on a tight schedule, so
/// this is deliberately conservative - short enough a user isn't left wondering why nothing moved
/// for a long time, long enough not to hammer `steamcommunity.com` with per-account scrape
/// requests. Also the unit `manager::wait_ticking` breaks into 1s checks against, so a `stop_farming`
/// call takes effect within ~1s rather than waiting out the full interval.
const DROPS_POLL_INTERVAL: std::time::Duration = std::time::Duration::from_secs(5 * 60);

/// Card drops remaining for one game, from that game's own badge page.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DropsRemaining {
    pub remaining: u32,
    pub playtime_hours: f32,
}

/// One owned game with at least one card drop remaining, from the account's badge overview pages.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameWithDrops {
    pub app_id: u32,
    pub name: String,
    pub remaining: u32,
    pub playtime_hours: f32,
}

/// Why a game left the cycle without the frontend ever seeing it in `active` for long (or at all) -
/// surfaced on [`CompletedFarm`] so the "session finished" summary can explain a fast-ending cycle
/// (every queued game already over its max-playtime cap before the first poll, the most common way a
/// cycle ends in well under a second) instead of it just looking like nothing happened. Mirrors
/// `achievement_unlocker::CompletedUnlockReason`'s identical role for that feature.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CompletedFarmReason {
    /// Card drops remaining hit zero - the game is genuinely done, nothing left to farm.
    DropsExhausted,
    /// Hit its per-game max-card-drops-farmed cap this session.
    MaxCardDrops,
    /// Hit its max-card-farming-time cap this session.
    MaxCardFarmingTime,
    /// Hit its max-playtime cap - either detected before it ever started farming (`manager::
    /// fetch_queued_games`'s own pre-check) or partway through (`manager::poll_active`'s check).
    MaxPlaytime,
}

/// One game a farming cycle fully finished with this pass, tagged with why - every reason now also
/// dequeues the game from the account's *persisted* `queue` (see `manager::poll_active`'s doc
/// comment for why this used to only apply to `DropsExhausted`, and why that was changed for parity
/// with `achievement_unlocker`, which always dequeues on any cap). Mirrors
/// `achievement_unlocker::CompletedUnlock`'s identical role in `AchievementUnlockerState::completed`.
/// Not populated for a user-initiated stop - matches achievement-unlocker's same distinction (a
/// manual stop isn't "this game is done").
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletedFarm {
    pub app_id: u32,
    pub name: String,
    /// Real remaining count, not hardcoded 0 - a cap-based stop can leave drops genuinely
    /// remaining, unlike `DropsExhausted` where 0 is always accurate.
    pub remaining: u32,
    pub reason: CompletedFarmReason,
}

/// One queued game as persisted to disk by [`queue`] - mirrors
/// `achievement_unlocker::AchievementUnlockerEntry`'s shape/reasoning exactly (`name` stored
/// alongside `app_id` so the queue tab can render an entry before a fresh `get_games_with_drops`
/// call resolves, and survives a game transiently missing from that response).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardFarmingQueueEntry {
    pub app_id: u32,
    pub name: String,
}

/// One farming cycle's full state - what `get_farming_state`/[`FARMING_STATE_EVENT`] return.
/// `active`/`queue`/`completed` only ever reflect *this* cycle's own bookkeeping, not a persisted
/// list - once a cycle ends (stopped or drops genuinely exhausted) its session is dropped entirely,
/// so a later `get_farming_state` call for the same account reads back `FarmingState::default()`.
#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FarmingState {
    pub is_farming: bool,
    /// Games currently being idled for their drops - up to `manager::MAX_CONCURRENT_FARMING` (32,
    /// mirroring `idling`'s own cap) at once.
    pub active: Vec<FarmingProgress>,
    /// Games with drops remaining that haven't started idling yet - backfilled into `active` as
    /// slots free up.
    pub queue: Vec<GameWithDrops>,
    pub completed: Vec<CompletedFarm>,
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
    /// When this game entered `active` - drives `settings::FarmingCaps`'s `maxCardFarmingTime`
    /// auto-stop check (`manager::is_capped`). Not reported to the frontend (this struct only
    /// derives `Serialize`, never `Deserialize`, so `#[serde(skip)]` needs no `Default`).
    #[serde(skip)]
    pub started_at: std::time::Instant,
    /// This game's real total playtime (`games::OwnedGame::playtime_forever_minutes`), read once
    /// when it entered `active` - the baseline `manager::poll_active`'s max-playtime auto-stop
    /// estimates forward from via `baseline_playtime_minutes + started_at.elapsed()`, avoiding a
    /// live re-fetch every poll. Not reported to the frontend - an internal auto-stop input only.
    #[serde(skip)]
    pub baseline_playtime_minutes: u64,
}
