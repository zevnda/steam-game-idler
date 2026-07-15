//! Steam Community session cookies (`sid`/`sls`/`sma`) and the HTTP-client/cookie-header plumbing
//! shared by every feature that authenticates against `steamcommunity.com` via cookie auth rather
//! than either sign-in backend's own session. `card_farming` (badge/gamecards pages) was this
//! module's original home; `inventory` (inventory/market pages) needs the exact same cookies and
//! the exact same acquire-or-derive-or-manual resolution flow (see [`session`]'s doc comment), so
//! this was extracted to the crate level once `inventory` became a second real consumer.

pub mod commands;
pub mod credentials;
pub mod session;

use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, USER_AGENT};
use reqwest::Client;
use serde::{Deserialize, Serialize};

const STEAM_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/// Steam Community session cookies - either pasted manually by the user (the free-tier path),
/// extracted from a hidden login webview ([`session::acquire`]), or derived from an agent-mode
/// account's live daemon session ([`session::derive_from_agent_session`]). `sma` mirrors `main`'s
/// optional `steamMachineAuth{steamId}` cookie (only set for accounts with a pending Steam Guard
/// machine confirmation).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SteamCookies {
    pub sid: String,
    pub sls: String,
    pub sma: Option<String>,
}

/// A plain `reqwest` client with the header set `steamcommunity.com` expects from a real browser -
/// shared by every cookie-authenticated scrape/action (`card_farming::scraper`,
/// `inventory::scraper`), since the session-acquisition webview's own cookie jar isn't usable here
/// (a plain `reqwest` client authenticates via the literal cookie *values* instead - see
/// `session`'s doc comment).
pub fn steam_client() -> reqwest::Result<Client> {
    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_static(STEAM_USER_AGENT));
    headers.insert(
        ACCEPT,
        HeaderValue::from_static("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
    );
    headers.insert(ACCEPT_LANGUAGE, HeaderValue::from_static("en-US,en;q=0.9"));

    Client::builder().default_headers(headers).build()
}

/// Builds the `Cookie` header value Steam Community expects - mirrors `main`'s exact construction,
/// including `steamparental` only ever appearing alongside `sma` (`main` never had a standalone
/// `steamparental` value of its own).
pub fn cookie_header(steam_id: &str, cookies: &SteamCookies) -> String {
    match &cookies.sma {
        Some(sma) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            cookies.sid, cookies.sls, sma, steam_id, sma
        ),
        None => format!(
            "sessionid={}; steamLoginSecure={}",
            cookies.sid, cookies.sls
        ),
    }
}
