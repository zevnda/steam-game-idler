//! CLI-mode free-game claiming. Steamworks.NET (the local-client backend) has no equivalent of
//! SteamKit2's `RequestFreeLicense` at all - license granting isn't part of the client SDK surface
//! games get - and even if it did, that opcode can't grant a temporarily-100%-discounted paid
//! package anyway (see `free_games/mod.rs`'s module doc comment). So CLI mode always needs a real
//! Steam Store web session to claim through `free_games::store_claim`'s direct POST -
//! Steamworks.NET has no way to derive one on its own, so [`ensure_store_session`] shows a real,
//! interactive Steam login window the first time an account claims a free game.
//!
//! Every claim after that reuses the same persisted per-account webview profile silently -
//! [`resolve_store_session`] extracts the current cookie *values* from it (not just checks
//! presence), confirms they still authenticate, and - if not - silently re-navigates that same
//! profile (no visible window) to let Steam's own page JS redeem the session's underlying,
//! much-longer-lived refresh token, before ever falling back to a real, visible re-login. Mirrors
//! `steam_community::session`'s exact extract/validate/refresh shape (built for card
//! farming/inventory's `steamcommunity.com` session) - see that module's doc comment for why this
//! can't just reuse that session directly (a completely separate cookie domain).

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow};

use crate::error::{AppError, AppResult};
use crate::free_games::store_claim::{self, OwnershipCheck};
use crate::free_games::{FreeGameClaimCorrection, FreeGameClaimOutcome};
use crate::local_steam::ownership;
use crate::platform;
use crate::steam_community::{cookie_header, SteamCookies};

const SESSION_POLL_TIMEOUT: Duration = Duration::from_secs(300);
const SESSION_POLL_INTERVAL: Duration = Duration::from_millis(500);
const STORE_LOGIN_URL: &str = "https://store.steampowered.com/login/?redir=&redir_ssl=1";

/// Bounded retry/backoff for [`validate_store_session`] confirming whether a session still
/// authenticates - mirrors `steam_community::session::validate`'s identical shape.
const VALIDATE_MAX_ATTEMPTS: u8 = 2;
const VALIDATE_RETRY_DELAY: Duration = Duration::from_millis(1500);

fn store_data_dir(app_handle: &AppHandle, steam_id: &str) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?
        .join(steam_id)
        .join("store-webview-data"))
}

fn has_store_login_cookie(window: &WebviewWindow, label: &str) -> AppResult<bool> {
    let Some(webview) = window.get_webview(label) else {
        return Ok(false);
    };
    let cookies = webview
        .cookies_for_url(
            tauri::Url::parse("https://store.steampowered.com/")
                .expect("static URL is always valid"),
        )
        .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;
    Ok(cookies.iter().any(|c| c.name() == "steamLoginSecure"))
}

/// Reads the current `steamLoginSecure` cookie *value* (not just presence) from this window's
/// cookie jar - `None` if it isn't there. Matches [`has_store_login_cookie`]'s exact "is logged in"
/// standard rather than also requiring a `sessionid` cookie - a real interactive login (QR or
/// credentials) routes through several Steam subdomains, and there's no guarantee it leaves a
/// `sessionid` cookie scoped to `store.steampowered.com` specifically.
///
/// `sid` is minted fresh via [`crate::steam_community::session::generate_session_id`] instead of
/// extracted - the same approach agent mode's claim path uses. Steam's CSRF check only needs the
/// form-submitted `sessionid` to match the cookie `sessionid` sent in that same out-of-band
/// request; it doesn't need to be a value the interactive login session itself ever saw. `sma`
/// stays `None` - no store-domain machine-auth cookie has been observed to matter here.
fn extract_store_cookies(window: &WebviewWindow, label: &str) -> AppResult<Option<SteamCookies>> {
    let Some(webview) = window.get_webview(label) else {
        return Ok(None);
    };
    let cookies = webview
        .cookies_for_url(
            tauri::Url::parse("https://store.steampowered.com/")
                .expect("static URL is always valid"),
        )
        .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;

    let sls = cookies
        .iter()
        .find(|c| c.name() == "steamLoginSecure")
        .map(|c| c.value().to_string());

    Ok(sls.map(|sls| SteamCookies {
        sid: crate::steam_community::session::generate_session_id(),
        sls,
        sma: None,
    }))
}

/// Deletes stale `sessionid`/`steamLoginSecure` cookies from the persisted store-webview profile
/// before a silent-revalidate retry, so the follow-up [`extract_store_cookies`] call can't just
/// re-find the same values [`validate_store_session`] already confirmed are dead - mirrors
/// `steam_community::session::clear_stale_session_cookies`'s exact reasoning.
fn clear_stale_store_cookies(window: &WebviewWindow, label: &str) -> AppResult<()> {
    let Some(webview) = window.get_webview(label) else {
        return Ok(());
    };
    let cookies = webview
        .cookies_for_url(
            tauri::Url::parse("https://store.steampowered.com/")
                .expect("static URL is always valid"),
        )
        .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;

    for cookie in cookies {
        if cookie.name() == "sessionid" || cookie.name() == "steamLoginSecure" {
            let _ = webview.delete_cookie(cookie.clone());
        }
    }
    Ok(())
}

/// Ensures a valid Steam store session (a `steamLoginSecure` cookie) exists in this account's
/// persistent webview profile - a no-op, invisible to the user, if one already does. Otherwise
/// shows the real Steam login page and waits (up to 5 minutes, matching `main`'s timeout) for the
/// user to sign in.
///
/// `pub` (not just [`resolve_store_session`]'s private helper) so
/// `free_games::commands::ensure_free_games_store_session` can call it directly - turning on
/// free-games auto-redeem for a CLI-mode account establishes the session up front, at the moment
/// the user flips the toggle, rather than a background poll unexpectedly popping up a real login
/// window later (see that command's doc comment). Also used by the settings tab's
/// "Reauthenticate" action.
pub async fn ensure_store_session(app_handle: &AppHandle, steam_id: &str) -> AppResult<()> {
    let label = format!("store-session-{steam_id}");
    let data_directory = store_data_dir(app_handle, steam_id)?;

    let window = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        &label,
        WebviewUrl::External(STORE_LOGIN_URL.parse().expect("static URL is always valid")),
    )
    .title("Steam Store Sign-In")
    .inner_size(800.0, 700.0)
    .visible(false)
    .data_directory(data_directory)
    .build()
    .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;

    tokio::time::sleep(Duration::from_millis(500)).await;

    if has_store_login_cookie(&window, &label)? {
        tracing::info!(steam_id, "free games: reused existing Steam store session");
        let _ = window.close();
        return Ok(());
    }

    window
        .show()
        .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;

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
            return Err(AppError::StoreLoginFailed(
                "sign-in window was closed before completing sign-in".to_string(),
            ));
        }
        if start.elapsed() > SESSION_POLL_TIMEOUT {
            let _ = window_clone.close();
            return Err(AppError::StoreLoginFailed(
                "timed out waiting for Steam store sign-in".to_string(),
            ));
        }
        if has_store_login_cookie(&window_clone, &label)? {
            tracing::info!(steam_id, "free games: established new Steam store session");
            let _ = window_clone.close();
            return Ok(());
        }
        tokio::time::sleep(SESSION_POLL_INTERVAL).await;
    }
}

/// Signs this account's persistent store-webview profile out - deletes the `sessionid`/
/// `steamLoginSecure` cookies for `store.steampowered.com`, mirroring `main`'s
/// `delete_store_cookies` but scoped to this account's own per-steam-id `data_directory` (not
/// `main`'s shared default WebView2 profile - see this module's doc comment for why that mattered).
/// The next claim (or a manual "Reauthenticate") will show a real login window again.
pub async fn clear_session(app_handle: &AppHandle, steam_id: &str) -> AppResult<()> {
    let label = format!("store-logout-{steam_id}");
    let data_directory = store_data_dir(app_handle, steam_id)?;

    let window = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        &label,
        WebviewUrl::External(
            "https://store.steampowered.com/"
                .parse()
                .expect("static URL is always valid"),
        ),
    )
    .title("Steam Store Sign-Out")
    .inner_size(0.0, 0.0)
    .visible(false)
    .data_directory(data_directory)
    .build()
    .map_err(|e| AppError::StoreLogoutFailed(e.to_string()))?;

    tokio::time::sleep(Duration::from_millis(1500)).await;

    let Some(webview) = window.get_webview(&label) else {
        let _ = window.close();
        return Err(AppError::StoreLogoutFailed(
            "failed to access the sign-out webview".to_string(),
        ));
    };

    let cookies = webview
        .cookies_for_url(
            tauri::Url::parse("https://store.steampowered.com/")
                .expect("static URL is always valid"),
        )
        .map_err(|e| AppError::StoreLogoutFailed(e.to_string()))?;

    for cookie in cookies {
        if cookie.name() == "sessionid" || cookie.name() == "steamLoginSecure" {
            webview
                .delete_cookie(cookie.clone())
                .map_err(|e| AppError::StoreLogoutFailed(e.to_string()))?;
        }
    }

    let _ = window.close();
    Ok(())
}

enum StoreSessionStatus {
    Valid,
    LoggedOut,
    Inconclusive,
}

/// Whether `cookies` still authenticate against `store.steampowered.com` - checks
/// `store.steampowered.com/account/`, which redirects to a `/login/`-pathed URL when signed out
/// and returns the account page directly (no redirect) when signed in. Retries once on an
/// otherwise-unclear response before giving up as `Inconclusive`, mirroring
/// `steam_community::session::validate`'s identical retry/backoff shape.
async fn validate_store_session(cookies: &SteamCookies) -> AppResult<StoreSessionStatus> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;
    let header = cookie_header("", cookies);

    for attempt in 0..VALIDATE_MAX_ATTEMPTS {
        let response = client
            .get("https://store.steampowered.com/account/")
            .header("Cookie", &header)
            .send()
            .await
            .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;

        let final_url = response.url().as_str().to_string();
        let status = response.status();
        // Logs the raw signal (not just the branch it resolves to) so an unexpected outcome shows
        // exactly what came back, rather than just "Inconclusive" with nothing to diagnose it from.
        tracing::info!(attempt, %final_url, status = status.as_u16(), "free games: store session validation check");

        if final_url.contains("/login") {
            return Ok(StoreSessionStatus::LoggedOut);
        }
        if status.is_success() {
            return Ok(StoreSessionStatus::Valid);
        }

        if attempt + 1 < VALIDATE_MAX_ATTEMPTS {
            tokio::time::sleep(VALIDATE_RETRY_DELAY).await;
        }
    }

    Ok(StoreSessionStatus::Inconclusive)
}

/// Opens (hidden) this account's persisted store-webview profile without navigating anywhere new -
/// shared by every helper below that just needs to read or refresh what's already in that profile's
/// cookie jar, rather than re-deriving the `WebviewWindowBuilder` setup at each call site. `purpose`
/// keeps each caller's window label distinct so concurrent opens (unlikely, but possible across
/// overlapping claim attempts) can't collide.
fn open_persisted_store_window(
    app_handle: &AppHandle,
    steam_id: &str,
    purpose: &str,
) -> AppResult<(WebviewWindow, String)> {
    let label = format!("store-{purpose}-{steam_id}");
    let data_directory = store_data_dir(app_handle, steam_id)?;
    let window = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        &label,
        WebviewUrl::External(STORE_LOGIN_URL.parse().expect("static URL is always valid")),
    )
    .visible(false)
    .data_directory(data_directory)
    .build()
    .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;
    Ok((window, label))
}

async fn extract_current_store_cookies(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<SteamCookies> {
    let (window, label) = open_persisted_store_window(app_handle, steam_id, "extract")?;
    tokio::time::sleep(Duration::from_millis(500)).await;
    let cookies = extract_store_cookies(&window, &label)?;
    let _ = window.close();
    cookies.ok_or_else(|| {
        AppError::StoreLoginFailed("no Steam store session cookies found".to_string())
    })
}

/// Silently re-navigates the persisted profile (no visible window) to let Steam's own page JS
/// redeem the session's underlying, much-longer-lived refresh token - `None` if that didn't
/// produce a validly-authenticating session, in which case the caller falls back to a real,
/// visible re-login.
async fn silently_refresh_store_session(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<Option<SteamCookies>> {
    let (window, label) = open_persisted_store_window(app_handle, steam_id, "refresh")?;
    clear_stale_store_cookies(&window, &label)?;
    window
        .navigate(STORE_LOGIN_URL.parse().expect("static URL is always valid"))
        .map_err(|e| AppError::StoreLoginFailed(e.to_string()))?;
    tokio::time::sleep(Duration::from_millis(1500)).await;
    let refreshed = extract_store_cookies(&window, &label)?;
    let _ = window.close();

    let Some(refreshed) = refreshed else {
        return Ok(None);
    };
    match validate_store_session(&refreshed).await? {
        StoreSessionStatus::Valid => Ok(Some(refreshed)),
        StoreSessionStatus::LoggedOut | StoreSessionStatus::Inconclusive => Ok(None),
    }
}

/// Resolves a ready-to-use Steam store session for `steam_id`'s claim: ensures a login exists at
/// all ([`ensure_store_session`], unchanged - a real login window shown only if genuinely needed),
/// extracts and validates its cookies, and - only on a confirmed-dead session - silently
/// re-navigates the same persisted profile to let Steam refresh it, before ever escalating to a
/// real, visible re-login. Mirrors `steam_community::session::ensure_valid`'s exact
/// reasoning/shape, targeting the store domain instead.
pub async fn resolve_store_session(
    app_handle: &AppHandle,
    steam_id: &str,
) -> AppResult<SteamCookies> {
    ensure_store_session(app_handle, steam_id).await?;
    let cookies = extract_current_store_cookies(app_handle, steam_id).await?;

    match validate_store_session(&cookies).await? {
        StoreSessionStatus::Valid => {
            tracing::info!(steam_id, "free games: store session valid");
            Ok(cookies)
        }
        // A single ambiguous check isn't worth forcing a re-login over - proceed with what we
        // have, same as `steam_community::session`'s equivalent judgment call.
        StoreSessionStatus::Inconclusive => {
            tracing::warn!(
                steam_id,
                "free games: could not confirm store session validity, proceeding anyway"
            );
            Ok(cookies)
        }
        StoreSessionStatus::LoggedOut => {
            tracing::info!(
                steam_id,
                "free games: store session expired, attempting a silent refresh"
            );
            if let Some(refreshed) = silently_refresh_store_session(app_handle, steam_id).await? {
                tracing::info!(steam_id, "free games: store session silently refreshed");
                return Ok(refreshed);
            }

            tracing::info!(
                steam_id,
                "free games: silent refresh failed, showing a real sign-in window"
            );
            clear_session(app_handle, steam_id).await?;
            ensure_store_session(app_handle, steam_id).await?;
            extract_current_store_cookies(app_handle, steam_id).await
        }
    }
}

/// Claims `app_id` as a free game for the local account identified by `steam_id`, via
/// `free_games::store_claim`'s direct authenticated POST - no webview involved in the claim itself,
/// only in establishing/refreshing the session beforehand ([`resolve_store_session`]).
pub async fn claim(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
) -> AppResult<FreeGameClaimOutcome> {
    tracing::info!(steam_id, app_id, "free games: claiming");
    let cookies = resolve_store_session(app_handle, steam_id).await?;
    let cookie_header_value = cookie_header("", &cookies);

    let check_owned: OwnershipCheck = Arc::new(move || {
        Box::pin(async move {
            ownership::check_ownership()
                .await
                .map(|games| games.iter().any(|g| g.app_id == app_id))
        })
    });

    let correction = FreeGameClaimCorrection::Local {
        steam_id: steam_id.to_string(),
        app_id,
    };

    store_claim::claim_via_direct_post(
        app_handle,
        steam_id,
        app_id,
        &cookie_header_value,
        &cookies.sid,
        correction,
        check_owned,
    )
    .await
}
