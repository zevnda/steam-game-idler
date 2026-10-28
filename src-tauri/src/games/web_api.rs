//! Steam Web API `IPlayerService/GetOwnedGames` lookup - the source of playtime data (and a name
//! fallback) for both backends' ownership lists, since neither
//! `Backends/SteamworksLocalBackend.cs`'s `CheckOwnershipAsync` nor
//! `Daemon/Bot/OwnershipManager.cs`'s `GetOwnedGamesAsync` returns playtime at all (see
//! `OwnedGame.cs`'s doc comment). Ported from `main`'s `game_data::get_games_list` Web API merge
//! step.

use reqwest::Client;
use serde::Deserialize;

use crate::error::{AppError, AppResult};
use crate::steam_web_api::resolve_api_key;

use super::AchievementProgress;

#[derive(Debug, Clone, Deserialize)]
pub struct WebApiGame {
    pub appid: u32,
    pub name: Option<String>,
    #[serde(default)]
    pub playtime_forever: u64,
    /// Unix timestamp of the game's last play session, returned by `GetOwnedGames` with no extra
    /// query param needed. `0` when Steam has no last-played record for this game (matches this
    /// endpoint's own "unset" convention - there's no separate optional wrapper on their side
    /// either). Powers the "Recently Played" dashboard carousel - see `OwnedGame::rtime_last_played`.
    #[serde(default)]
    pub rtime_last_played: u64,
}

#[derive(Debug, Deserialize)]
struct GetOwnedGamesResponse {
    #[serde(default)]
    response: GetOwnedGamesInner,
}

#[derive(Debug, Deserialize, Default)]
struct GetOwnedGamesInner {
    // Present (even as `0`) whenever the request actually resolved a games list; entirely absent
    // when Steam blocked the request because the account behind `steamid` has its profile/game
    // details set to private and `key` isn't that account's own API key (Valve's documented
    // signal - the response body is a bare `{}` in that case, not an error or empty-but-typed
    // object). This is what lets `fetch_owned_games` distinguish "genuinely zero games" from
    // "likely private profile" rather than inferring it from an empty list.
    game_count: Option<u32>,
    #[serde(default)]
    games: Vec<WebApiGame>,
}

pub struct OwnedGamesFetch {
    pub games: Vec<WebApiGame>,
    pub possibly_private: bool,
}

pub async fn fetch_owned_games(steam_id: &str, api_key: Option<String>) -> AppResult<OwnedGamesFetch> {
    let key = resolve_api_key(api_key)?;
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={key}&steamid={steam_id}&include_appinfo=true&include_played_free_games=true&include_free_sub=true&skip_unvetted_apps=false&include_extended_appinfo=false"
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?;

    let body: GetOwnedGamesResponse = response
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    Ok(OwnedGamesFetch {
        possibly_private: body.response.game_count.is_none(),
        games: body.response.games,
    })
}

/// How many app ids go into one `GetTopAchievementsForGames` request. Measured live (2026-10):
/// 350 worked, 400 was rejected with a 400 - this leaves headroom under that undocumented cap.
const ACHIEVEMENT_PROGRESS_BATCH_SIZE: usize = 200;

/// `max_achievements` asks for every unlocked achievement per game rather than a "top N" preview -
/// its length is the unlocked count. Verified to match `GetPlayerAchievements` exactly, and a game
/// with 1,342 achievements matched the daemon's full schema fetch, so Steam doesn't clamp it low.
const ACHIEVEMENT_PROGRESS_MAX_PER_GAME: u32 = 10_000;

#[derive(Debug, Deserialize)]
struct TopAchievementsResponse {
    #[serde(default)]
    response: TopAchievementsInner,
}

#[derive(Debug, Deserialize, Default)]
struct TopAchievementsInner {
    #[serde(default)]
    games: Vec<TopAchievementsGame>,
}

#[derive(Debug, Deserialize)]
struct TopAchievementsGame {
    appid: u32,
    /// Absent (not `0`) for a game with no achievements at all.
    #[serde(default)]
    total_achievements: u32,
    /// Only the unlocked ones - absent when none are unlocked. Each entry also carries name/icon
    /// fields this never reads, so they're left as opaque values.
    #[serde(default)]
    achievements: Vec<serde_json::Value>,
}

/// CLI mode's source for `achievement_progress` - `IPlayerService/GetTopAchievementsForGames`,
/// batched. (`IPlayerService/GetAchievementsProgress` looks like the obvious fit, but it rejects
/// Web API keys outright - 401, access-token only - and serves stale cached counts anyway; see
/// `Daemon/Bot/AchievementProgressManager.cs`.) Measured live, but subject to profile privacy -
/// callers skip it for a `possibly_private` account.
///
/// Takes the user's own key as a plain `&str`, deliberately never falling back to the embedded
/// shared key via `resolve_api_key` the way `fetch_owned_games` does: a full library refresh costs
/// one call per 200 games, and that shared key's daily quota is pooled across every install - a
/// sort option isn't worth risking it for every other feature that depends on it. Taking no
/// `Option` makes that impossible to undo by accident at a call site.
///
/// A failed batch is logged and skipped rather than failing the whole fetch - its games just stay
/// absent, and `achievement_progress` keeps their previously cached counts.
pub async fn fetch_achievement_progress(
    steam_id: &str,
    own_api_key: &str,
    app_ids: &[u32],
) -> AppResult<Vec<AchievementProgress>> {
    let client = Client::new();
    let mut progress = Vec::with_capacity(app_ids.len());

    for batch in app_ids.chunks(ACHIEVEMENT_PROGRESS_BATCH_SIZE) {
        let mut query: Vec<(String, String)> = vec![
            ("key".into(), own_api_key.to_string()),
            ("steamid".into(), steam_id.to_string()),
            ("language".into(), "english".into()),
            (
                "max_achievements".into(),
                ACHIEVEMENT_PROGRESS_MAX_PER_GAME.to_string(),
            ),
        ];
        query.extend(
            batch
                .iter()
                .enumerate()
                .map(|(i, app_id)| (format!("appids[{i}]"), app_id.to_string())),
        );

        let body = match client
            .get("https://api.steampowered.com/IPlayerService/GetTopAchievementsForGames/v1/")
            .query(&query)
            .send()
            .await
            .and_then(|r| r.error_for_status())
        {
            Ok(response) => response.json::<TopAchievementsResponse>().await,
            Err(e) => Err(e),
        };

        match body {
            Ok(body) => progress.extend(progress_from_response(body)),
            Err(e) => tracing::warn!(
                steam_id,
                batch_size = batch.len(),
                error = %e,
                "achievement progress: Web API batch failed, keeping cached counts for it"
            ),
        }
    }

    Ok(progress)
}

fn progress_from_response(body: TopAchievementsResponse) -> Vec<AchievementProgress> {
    body.response
        .games
        .into_iter()
        .map(|game| AchievementProgress {
            app_id: game.appid,
            // `min` guards the one inconsistency that would read as "over 100%".
            unlocked: (game.achievements.len() as u32).min(game.total_achievements),
            total: game.total_achievements,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    // Trimmed real `GetTopAchievementsForGames` response (2026-10): a game with some unlocked, one
    // with none unlocked (`achievements` absent), and one with no achievements at all
    // (`total_achievements` absent too) - each of which must stay distinguishable.
    #[test]
    fn counts_unlocked_achievements_per_game_and_tolerates_absent_fields() {
        let json = r#"{"response":{"games":[
            {"appid":513710,"total_achievements":69,"achievements":[
                {"statid":1,"bit":0,"name":"A","desc":"","icon":"","icon_gray":"","hidden":false,"player_percent_unlocked":"12.5"},
                {"statid":1,"bit":1,"name":"B","desc":"","icon":"","icon_gray":"","hidden":false,"player_percent_unlocked":"3.1"}
            ]},
            {"appid":359550,"total_achievements":48},
            {"appid":1069690}
        ]}}"#;
        let body: TopAchievementsResponse = serde_json::from_str(json).unwrap();
        assert_eq!(
            progress_from_response(body),
            vec![
                AchievementProgress { app_id: 513710, unlocked: 2, total: 69 },
                AchievementProgress { app_id: 359550, unlocked: 0, total: 48 },
                AchievementProgress { app_id: 1069690, unlocked: 0, total: 0 },
            ]
        );
    }

    #[test]
    fn an_empty_privacy_blocked_response_parses_to_nothing() {
        let body: TopAchievementsResponse = serde_json::from_str(r#"{"response":{}}"#).unwrap();
        assert!(progress_from_response(body).is_empty());
    }
}
