//! Pausing automation while another session on the same account is playing a game - the user
//! launched a game on their real Steam client (often on a different machine than the one SGI runs
//! on). Steam only lets one session per account "play" at a time; the daemon learns who holds that
//! slot from Steam's own `PlayingSessionState` push (see `Daemon/Bot/SteamBot.cs::PlayingBlocked`)
//! and reports it to [`super::process::PlayingSession`].
//!
//! Idling itself needs nothing from here - the daemon holds back every idle announce on its own
//! while blocked and re-announces the untouched idle-claims union once unblocked, so manual idling,
//! auto-idle and card farming's idle cycles all pause and resume without knowing about this. Only
//! automation that does something *other* than idling on a timer - the achievement unlocker's
//! unlock requests, card farming's badge-page re-scrapes - waits here, so it doesn't make progress
//! (or burn through its per-achievement delays / scrape Steam Community in a loop) while nothing is
//! actually idling.
//!
//! Wall-clock timers that aren't gated here keep running while paused - `idling::auto_stop`'s max
//! idle time and `max_playtime`'s forward estimate both count paused time as idle time. That only
//! ever makes them stop a game *earlier* than configured, never later, so it's left as is rather
//! than threading pause-awareness through every timer.

use std::sync::atomic::AtomicBool;
use std::time::Duration;

use tauri::{AppHandle, Manager};

use crate::async_utils::wait_ticking;
use crate::games::commands::GamesAccount;

use super::AgentManager;

/// How often [`wait_while_playing_blocked`] re-checks the cached state - it's an in-memory read,
/// so this only bounds how quickly a resume is noticed after the daemon's own 60s grace ends.
const PLAYING_POLL_INTERVAL: Duration = Duration::from_secs(5);

/// Whether `account`'s automation should currently hold off because another session is playing.
/// Always `false` for CLI mode, which has no daemon session and so no such signal - a local Steam
/// client can only run one game session anyway, which the user would see directly.
pub async fn is_playing_blocked(app_handle: &AppHandle, account: &GamesAccount) -> bool {
    match account {
        GamesAccount::Agent { username } => {
            app_handle
                .state::<AgentManager>()
                .playing_session(username)
                .await
                .blocked
        }
        GamesAccount::Local { .. } => false,
    }
}

/// Blocks while [`is_playing_blocked`] is true - returns `true` if `stopped` was set while
/// waiting, same contract as [`wait_ticking`]. Returns immediately (`false`) when not blocked, so
/// callers can gate unconditionally.
pub async fn wait_while_playing_blocked(
    app_handle: &AppHandle,
    account: &GamesAccount,
    stopped: &AtomicBool,
) -> bool {
    while is_playing_blocked(app_handle, account).await {
        if wait_ticking(PLAYING_POLL_INTERVAL, stopped).await {
            return true;
        }
    }
    stopped.load(std::sync::atomic::Ordering::SeqCst)
}
