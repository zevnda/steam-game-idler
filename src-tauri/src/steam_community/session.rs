//! Automatic Steam Community session/cookie acquisition (gamer-tier only, gated by whichever
//! feature's frontend is calling in - see `card_farming::mod.rs`/`inventory::mod.rs`). Genuinely
//! per-backend: CLI mode has no live network session of its own, so [`acquire`]'s hidden webview -
//! adapted from `local_steam::free_game_claim::ensure_store_session`, but targeting
//! `steamcommunity.com` instead of the store, and extracting actual cookie *values* (not just
//! presence) since callers authenticate via a plain `reqwest` client, not the webview's own cookie
//! jar - is the only option. Agent mode's daemon already holds a live, authenticated SteamKit2
//! connection, which can mint web-session cookies directly (see [`derive_from_agent_session`])
//! with no webview and no login prompt at all.

use std::path::PathBuf;
use std::time::Duration;

use rand::RngCore;
use regex::Regex;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow};

use crate::error::{AppError, AppResult};
use crate::games::commands::GamesAccount;
use crate::platform;
use crate::steam_agent::AgentManager;

use super::{cookie_header, credentials, steam_client, SteamCookies};

const SESSION_POLL_TIMEOUT: Duration = Duration::from_secs(300);
const SESSION_POLL_INTERVAL: Duration = Duration::from_millis(500);
const LOGIN_URL: &str = "https://steamcommunity.com/login/home/?goto=";

fn session_data_dir(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join("card-farming-webview-data"))
}

/// Reads whatever `sessionid`/`steamLoginSecure`/`steamMachineAuth{steamId}` cookies currently sit
/// in this window's cookie jar - `None` unless both the required cookies (`sid`/`sls`) are present;
/// `sma` is genuinely optional (see `mod.rs`'s doc comment on [`SteamCookies`]).
fn extract_cookies(
    window: &WebviewWindow,
    label: &str,
    steam_id: &str,
) -> AppResult<Option<SteamCookies>> {
    let Some(webview) = window.get_webview(label) else {
        return Ok(None);
    };
    let cookies = webview
        .cookies_for_url(
            tauri::Url::parse("https://steamcommunity.com/").expect("static URL is always valid"),
        )
        .map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;

    let sma_cookie_name = format!("steamMachineAuth{steam_id}");
    let mut sid = None;
    let mut sls = None;
    let mut sma = None;

    for cookie in cookies {
        match cookie.name() {
            "sessionid" => sid = Some(cookie.value().to_string()),
            "steamLoginSecure" => sls = Some(cookie.value().to_string()),
            name if name == sma_cookie_name => sma = Some(cookie.value().to_string()),
            _ => {}
        }
    }

    Ok(match (sid, sls) {
        (Some(sid), Some(sls)) => Some(SteamCookies { sid, sls, sma }),
        _ => None,
    })
}

/// Deletes this profile's `sessionid`/`steamLoginSecure`/`steamMachineAuth{steam_id}` cookies
/// before a forced silent-revalidate retry (see [`acquire`]'s `force_relogin` doc), so the
/// follow-up [`extract_cookies`] call can't just re-find the same values [`validate`] already
/// confirmed are dead - `extract_cookies` only ever checks presence, never server-side validity.
/// Reuses the exact `Cookie` objects WebView2 itself just reported holding (via `cookies_for_url`)
/// rather than reconstructing new ones with a guessed domain/path: `Webview::delete_cookie` matches
/// by the cookie's own attributes, and `ICoreWebView2CookieManager` needs those to agree with what
/// it actually stored (Steam's leading-dot `.steamcommunity.com` domain, in practice) to delete the
/// right entry instead of silently no-op'ing on a freshly-constructed one that doesn't match - see
/// wry's `webview2::cookie_into_win32`. Best-effort per cookie (`let _ =`) - a delete failing for
/// one stale cookie shouldn't abort the whole retry attempt; worst case that one specific value
/// survives and the retry ends up back at the same "still logged out" outcome it would've reached
/// anyway without this function existing at all.
fn clear_stale_session_cookies(
    window: &WebviewWindow,
    label: &str,
    steam_id: &str,
) -> AppResult<()> {
    let Some(webview) = window.get_webview(label) else {
        return Ok(());
    };
    let cookies = webview
        .cookies_for_url(
            tauri::Url::parse("https://steamcommunity.com/").expect("static URL is always valid"),
        )
        .map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;

    let sma_cookie_name = format!("steamMachineAuth{steam_id}");
    for cookie in cookies {
        let is_stale_session_cookie = matches!(cookie.name(), "sessionid" | "steamLoginSecure")
            || cookie.name() == sma_cookie_name;
        if is_stale_session_cookie {
            let _ = webview.delete_cookie(cookie);
        }
    }
    Ok(())
}

/// Automatically retrieves this account's Steam Community session cookies via a hidden webview.
/// Cookies persist on disk in this account's own per-steam-id WebView2 profile
/// (`session_data_dir` - still named for card farming, its first consumer, since the profile is
/// shared by every cookie-authenticated feature for the same account rather than one per feature),
/// so only the *first* call per account is likely to show a real, visible Steam login window -
/// every call after that finds the cookies already present and returns immediately, mirroring
/// `free_game_claim::ensure_store_session`'s same "transparent unless first-time" behavior (up to
/// and including the 5-minute sign-in timeout).
///
/// `force_relogin` is [`ensure_valid`]'s silent-revalidate retry only - it clears this profile's
/// stale `sessionid`/`steamLoginSecure`/`steamMachineAuth{steam_id}` cookies first
/// ([`clear_stale_session_cookies`]) so the check below can't just re-find the same values
/// `validate` already confirmed are dead; any *other* persistent Steam login state the profile
/// still holds is left untouched, so navigating still resolves silently (no visible window) if the
/// browser-level Steam session underneath is actually still alive.
pub async fn acquire(
    app_handle: &AppHandle,
    steam_id: &str,
    force_relogin: bool,
) -> AppResult<SteamCookies> {
    let label = format!("card-farming-session-{steam_id}");
    let data_directory = session_data_dir(app_handle, steam_id)?;

    let window = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        &label,
        WebviewUrl::External(LOGIN_URL.parse().expect("static URL is always valid")),
    )
    .title("Steam Community Sign-In")
    .inner_size(800.0, 700.0)
    .visible(false)
    .data_directory(data_directory)
    .build()
    .map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;

    if force_relogin {
        clear_stale_session_cookies(&window, &label, steam_id)?;
    }

    tokio::time::sleep(Duration::from_millis(500)).await;

    if let Some(cookies) = extract_cookies(&window, &label, steam_id)? {
        let _ = window.close();
        return Ok(cookies);
    }

    window
        .show()
        .map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;

    let window_clone = window.clone();
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            let _ = tx.try_send(());
        }
    });

    let start = std::time::Instant::now();
    loop {
        if rx.try_recv().is_ok() {
            return Err(AppError::SteamCommunitySessionFailed(
                "sign-in window was closed before completing sign-in".to_string(),
            ));
        }
        if start.elapsed() > SESSION_POLL_TIMEOUT {
            let _ = window_clone.close();
            return Err(AppError::SteamCommunitySessionFailed(
                "timed out waiting for Steam Community sign-in".to_string(),
            ));
        }
        if let Some(cookies) = extract_cookies(&window_clone, &label, steam_id)? {
            let _ = window_clone.close();
            return Ok(cookies);
        }
        tokio::time::sleep(SESSION_POLL_INTERVAL).await;
    }
}

/// Builds a `sessionid` cookie value - an opaque, client-generated token Steam Community never
/// actually issues (confirmed against other SteamKit2-based bots, which mint
/// their own the same way rather than obtaining one from Steam), 24 lowercase hex chars matching
/// the length/shape of a real browser-issued one. `pub(crate)` (not just this module's own
/// `derive_from_agent_session`) so `local_steam::free_game_claim::claim_via_agent_session` can
/// mint one too - a free-game claim's cookie priming needs the exact same shape, for the store
/// domain instead of the community one.
pub(crate) fn generate_session_id() -> String {
    let mut bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Derives Steam Community cookies from an agent-mode account's already-authenticated daemon
/// connection - see `AgentManager::get_web_session`/`Daemon/Bot/AuthFlow.cs::GetWebSessionAsync`.
/// No webview, no login prompt, ever: the whole point of this path for gamer-tier agent-mode
/// accounts.
async fn derive_from_agent_session(
    agent_manager: &AgentManager,
    username: &str,
) -> AppResult<SteamCookies> {
    let session = agent_manager.get_web_session(username).await?;
    Ok(SteamCookies {
        sid: generate_session_id(),
        sls: session.steam_login_secure,
        sma: None,
    })
}

/// Resolves the cookies a Steam Community call should use: passes `manual` straight through
/// untouched if the caller supplied one (the casual/free-tier fallback - no webview, no tier check
/// here), otherwise branches on sign-in mode - agent mode derives cookies directly from its live
/// daemon session ([`derive_from_agent_session`]), local mode falls back to the automatic webview
/// flow in [`acquire`], its only option. No cross-mode fallback: if agent mode's derivation fails,
/// that's surfaced as a real error rather than silently falling through to a webview/login prompt,
/// which would defeat the reason this path exists.
///
/// Local mode's result also goes through [`ensure_valid`] - unlike an agent-mode session (always
/// freshly derived, see below), a webview-acquired or manually-pasted cookie set can look present
/// while the underlying Steam session has actually expired (~24h manual-credentials expiry), and
/// neither the OS credential store nor the webview's own persisted profile track that on their own.
pub async fn resolve(
    app_handle: &AppHandle,
    agent_manager: &AgentManager,
    account: &GamesAccount,
    steam_id: &str,
    manual: Option<SteamCookies>,
) -> AppResult<SteamCookies> {
    match account {
        GamesAccount::Agent { username } => {
            if let Some(cookies) = manual {
                tracing::info!(steam_id, "steam community: using manually-supplied cookies");
                return Ok(cookies);
            }
            tracing::info!(
                steam_id,
                "steam community: deriving cookies from the agent-mode session"
            );
            derive_from_agent_session(agent_manager, username).await
        }
        GamesAccount::Local { .. } => {
            let is_manual = manual.is_some();
            let cookies = match manual {
                Some(cookies) => {
                    tracing::info!(steam_id, "steam community: using manually-supplied cookies");
                    cookies
                }
                None => {
                    tracing::info!(
                        steam_id,
                        "steam community: acquiring cookies automatically via webview"
                    );
                    acquire(app_handle, steam_id, false).await?
                }
            };
            ensure_valid(app_handle, steam_id, cookies, is_manual).await
        }
    }
}

/// Whether a resolved cookie set still authenticates against Steam Community. Ported from `main`'s
/// `utils.rs::validate_session` - same two-attempt/1.5s-backoff shape and
/// `account_dropdown`/`steamLoginSecure=deleted` detection, typed onto an enum instead of a raw
/// `serde_json::Value` and reusing this module's own `steam_client`/`cookie_header` helpers instead
/// of building a bespoke client/cookie string.
pub enum SessionStatus {
    Valid {
        user: String,
    },
    LoggedOut,
    /// Steam gave no definitive answer across every attempt (network hiccup, unexpected page
    /// shape) - deliberately not treated as logged-out, so a transient failure never clears a
    /// possibly-still-good credential (matches `main`'s own "Inconclusive" outcome).
    Inconclusive,
}

const VALIDATE_MAX_ATTEMPTS: u8 = 2;
const VALIDATE_RETRY_DELAY: Duration = Duration::from_millis(1500);

pub async fn validate(steam_id: &str, cookies: &SteamCookies) -> AppResult<SessionStatus> {
    let client =
        steam_client().map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;
    let cookie_value = cookie_header(steam_id, cookies);

    let logged_in_block = Regex::new(
        r#"<div\s+class="popup_block_new"\s+id="account_dropdown"\s+style="display:\s*none;"#,
    )
    .expect("static regex is always valid");
    let username_link = Regex::new(
        r#"<a\s+href="https://steamcommunity\.com/(id|profiles)/[^"]*"\s+data-miniprofile="\d+">([^<]+)</a>"#,
    )
    .expect("static regex is always valid");

    for attempt in 0..VALIDATE_MAX_ATTEMPTS {
        let response = client
            .get("https://steamcommunity.com/?l=english")
            .header("Cookie", &cookie_value)
            .send()
            .await
            .map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;

        let session_revoked = response
            .headers()
            .get_all("set-cookie")
            .iter()
            .any(|value| {
                value
                    .to_str()
                    .map(|s| s.contains("steamLoginSecure=deleted"))
                    .unwrap_or(false)
            });

        let html = response
            .text()
            .await
            .map_err(|e| AppError::SteamCommunitySessionFailed(e.to_string()))?;

        if logged_in_block.is_match(&html) {
            if let Some(captures) = username_link.captures(&html) {
                return Ok(SessionStatus::Valid {
                    user: captures[2].to_string(),
                });
            }
        }

        if session_revoked {
            return Ok(SessionStatus::LoggedOut);
        }

        if attempt + 1 < VALIDATE_MAX_ATTEMPTS {
            tokio::time::sleep(VALIDATE_RETRY_DELAY).await;
        }
    }

    Ok(SessionStatus::Inconclusive)
}

/// Confirms `cookies` still authenticate before handing them back to a caller. Only the automatic/
/// webview-acquired path (`!is_manual`) gets a silent retry on [`SessionStatus::LoggedOut`]:
/// re-navigating the account's persisted webview profile (see [`acquire`]) picks up a refreshed
/// cookie for free if the underlying browser-level Steam session is still alive, with no prompt
/// unless it's genuinely dead too (in which case `acquire` shows its own real, visible login
/// window, same as a first-time connect). A manually-pasted cookie set has no such session to
/// refresh, so it goes straight to the expired outcome - mirrors `main`'s gamer-tier-only
/// `autoRevalidateSteamCredentials` silent-retry, except the gate here is "was this cookie set
/// resolved automatically" rather than a tier check, since only the automatic path ever has a live
/// webview session to refresh (see `commands.rs`'s doc comment on why no Rust-side tier check
/// exists at all).
///
/// On a definitive, unrecoverable [`SessionStatus::LoggedOut`], clears whatever manually-saved
/// credentials exist for this account (`credentials::clear`) so the next connect attempt starts
/// clean instead of silently re-trying the same dead cookies, and returns
/// `AppError::SteamCommunitySessionExpired` so the frontend can prompt the user to reconnect rather
/// than showing a generic error (see that error's doc comment).
///
/// The retry passes `force_relogin: true` to [`acquire`] - without it, `acquire`'s own cached-cookie
/// short-circuit would just re-find the exact values [`validate`] already confirmed are dead
/// (`extract_cookies` only checks presence, never server-side validity), making the retry a no-op.
async fn ensure_valid(
    app_handle: &AppHandle,
    steam_id: &str,
    cookies: SteamCookies,
    is_manual: bool,
) -> AppResult<SteamCookies> {
    match validate(steam_id, &cookies).await? {
        SessionStatus::Valid { user } => {
            tracing::info!(steam_id, user = %user, "steam community: session is valid");
            Ok(cookies)
        }
        SessionStatus::Inconclusive => {
            tracing::warn!(
                steam_id,
                "steam community: could not confirm session validity, treating as transient"
            );
            Err(AppError::SteamCommunitySessionFailed(
                "could not confirm Steam Community session validity".to_string(),
            ))
        }
        SessionStatus::LoggedOut => {
            if !is_manual {
                let retried = acquire(app_handle, steam_id, true).await?;
                if let SessionStatus::Valid { user } = validate(steam_id, &retried).await? {
                    tracing::info!(
                        steam_id,
                        user = %user,
                        "steam community: session silently revalidated"
                    );
                    return Ok(retried);
                }
            }
            let _ = credentials::clear(steam_id);
            tracing::info!(
                steam_id,
                "steam community: session expired, saved credentials cleared"
            );
            Err(AppError::SteamCommunitySessionExpired(steam_id.to_string()))
        }
    }
}
