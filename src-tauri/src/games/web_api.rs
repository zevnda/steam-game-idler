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
