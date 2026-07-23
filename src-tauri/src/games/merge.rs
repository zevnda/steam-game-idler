//! Merges each backend's authoritative ownership list (real owned app IDs, name only when the
//! backend happens to know it - see `RawOwnedGame`) with playtime/name data from the Steam Web API
//! (`web_api::fetch_owned_games`) into the one shape the frontend renders.

use std::collections::HashSet;

use super::web_api::WebApiGame;
use super::{OwnedGame, RawOwnedGame};

pub fn merge(raw_games: Vec<RawOwnedGame>, web_games: Vec<WebApiGame>) -> Vec<OwnedGame> {
    let mut merged = Vec::with_capacity(raw_games.len());
    let mut seen: HashSet<u32> = HashSet::with_capacity(raw_games.len());

    for game in &raw_games {
        let web_match = web_games.iter().find(|w| w.appid == game.app_id);
        let name = game
            .name
            .clone()
            .or_else(|| web_match.and_then(|w| w.name.clone()));
        let playtime_forever_minutes = web_match.map(|w| w.playtime_forever).unwrap_or(0);
        let rtime_last_played = web_match.map(|w| w.rtime_last_played).unwrap_or(0);

        merged.push(OwnedGame {
            app_id: game.app_id,
            name,
            playtime_forever_minutes,
            rtime_last_played,
            // The Steam Web API has no purchase-date data at all - only agent mode's daemon
            // (via `merge::from_agent`) can ever populate this.
            last_refund_eligible_purchase_unix_seconds: None,
        });
        seen.insert(game.app_id);
    }

    // The Web API can know about owned games the backend-specific ownership check didn't surface
    // (e.g. not on the curated real-games whitelist, or a very recent purchase PICS hasn't caught
    // up to) - `main`'s `get_games_list` folds these in too rather than silently dropping them.
    for web_game in web_games {
        if seen.insert(web_game.appid) {
            merged.push(OwnedGame {
                app_id: web_game.appid,
                name: web_game.name,
                playtime_forever_minutes: web_game.playtime_forever,
                rtime_last_played: web_game.rtime_last_played,
                last_refund_eligible_purchase_unix_seconds: None,
            });
        }
    }

    merged
}

/// Agent mode's counterpart to [`merge`] - `RawOwnedGame`'s ownership already came from PICS (the
/// full, correct owned-games list, no curated-whitelist gap `merge` above has to fold Web API
/// results in for) and its playtime already came from `OwnershipManager`'s own
/// `Player.GetOwnedGames#1` enrichment, so there's no second source to reconcile against - just
/// the shape change. `unwrap_or(0)` is a defensive fallback (e.g. a daemon whose CM playtime call
/// failed this fetch - see `OwnershipManager.GetPlaytimesAsync`'s doc comment), not the expected
/// case.
pub fn from_agent(raw_games: Vec<RawOwnedGame>) -> Vec<OwnedGame> {
    raw_games
        .into_iter()
        .map(|game| OwnedGame {
            app_id: game.app_id,
            name: game.name,
            playtime_forever_minutes: game.playtime_forever_minutes.unwrap_or(0),
            rtime_last_played: game.rtime_last_played.unwrap_or(0),
            last_refund_eligible_purchase_unix_seconds: game.last_refund_eligible_purchase_unix_seconds,
        })
        .collect()
}
