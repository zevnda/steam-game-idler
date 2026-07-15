//! CLI-mode free-game claiming, and agent mode's fallback for the promo packages
//! `RequestFreeLicense` can't grant directly (see `steam_agent::AgentManager::request_free_license`'s
//! doc comment). Steamworks.NET (the local-client backend) has no equivalent of SteamKit2's
//! `RequestFreeLicense` at all - license granting isn't part of the client SDK surface games get -
//! so CLI mode always falls back to `main`'s approach: a hidden Tauri webview navigated to the store
//! page, with injected JS that finds and clicks the "Add to Account" button. Ported from `main`'s
//! `open_store_login_window`/`redeem_free_game`, fixed to give both the login and claim windows the
//! same per-account `data_directory` (`main` used the shared default WebView2 profile for the
//! redeem window, so it often couldn't see the login window's cookies).
//!
//! No separate settings-gated "sign in to Steam Store" step exists for CLI mode - `claim`
//! transparently calls `ensure_store_session` first, so the first claim per account may briefly
//! show a real Steam login window, and every claim after that (cookies persist on disk in the
//! per-account profile dir) is silent. Agent mode never shows a login window at all -
//! `claim_via_agent_session` primes the same webview with cookies derived straight from the live
//! SteamKit2 session instead.
//!
//! **Outcome detection never reads anything back from the claim webview's JS** - every
//! `document.title`-sentinel approach tried turned out unreliable for a hidden window (see
//! `claim_via_store_page`'s doc comment). It checks the Steam Web API's `GetOwnedGames` instead.

use std::path::PathBuf;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow};

use crate::error::{AppError, AppResult};
use crate::free_games::{FreeGameClaimCorrection, FreeGameClaimOutcome, FREE_GAME_CLAIM_CORRECTED_EVENT};
use crate::games::web_api as games_web_api;
use crate::platform;

const SESSION_POLL_TIMEOUT: Duration = Duration::from_secs(300);
const SESSION_POLL_INTERVAL: Duration = Duration::from_millis(500);
const STORE_LOGIN_URL: &str = "https://store.steampowered.com/login/?redir=&redir_ssl=1";

/// Delays between `GetOwnedGames` checks in `claim`'s synchronous polling window - growing gaps
/// since a real grant isn't always reflected quickly. 9 delays => 10 checks, spanning ~45s.
const CLAIM_POLL_DELAYS_MS: &[u64] = &[2000, 2000, 3000, 3000, 4000, 5000, 6000, 8000, 10000];

/// Delays for the background tail recheck spawned when the synchronous window above still hasn't
/// seen the game as owned - runs detached from the already-returned `claim` call, so it can afford
/// to keep checking for a couple more minutes without holding up the UI.
const CORRECTION_POLL_DELAYS_MS: &[u64] = &[15000, 20000, 30000, 40000];

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

/// Ensures a valid Steam store session (a `steamLoginSecure` cookie) exists in this account's
/// persistent webview profile - a no-op, invisible to the user, if one already does. Otherwise
/// shows the real Steam login page and waits (up to 5 minutes, matching `main`'s timeout) for the
/// user to sign in.
///
/// `pub` (not just `claim`'s private helper) so `free_games::commands::ensure_free_games_store_session`
/// can call it directly - turning on free-games auto-redeem for a CLI-mode account establishes the
/// session up front, at the moment the user flips the toggle, rather than a background poll
/// unexpectedly popping up a real login window later (see that command's doc comment).
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
/// The next auto-redeem attempt (or a manual "Reauthenticate") will show a real login window again.
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

/// Claims `app_id` as a free game for the local account identified by `steam_id`. Calls
/// [`ensure_store_session`] first (the interactive, persisted-cookie login CLI mode needs), then
/// delegates to [`claim_via_store_page`] for the actual navigate/click/poll mechanics.
pub async fn claim(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    api_key: Option<String>,
) -> AppResult<FreeGameClaimOutcome> {
    tracing::info!(steam_id, app_id, "free games: claiming");
    ensure_store_session(app_handle, steam_id).await?;
    claim_via_store_page(app_handle, steam_id, app_id, api_key, None, None).await
}

/// Agent-mode fallback for `RequestFreeLicense`'s ambiguous "granted=false, Result=OK" response,
/// used once `AgentManager::request_free_license` has confirmed via a real ownership check that
/// the game genuinely isn't owned yet (see that function's doc comment) - some limited-time free
/// promos aren't `FreeOnDemand` packages `RequestFreeLicense` can grant at all, and instead go
/// through Steam's normal cart/checkout flow, exactly what [`claim_via_store_page`] already
/// targets for CLI mode. No interactive login here: `steam_login_secure` is derived straight from
/// the live SteamKit2 connection (`AgentManager::get_web_session`/
/// `Daemon/Bot/AuthFlow.cs::GetWebSessionAsync`) and injected into the claim webview via
/// `document.cookie` before its first navigation - `sessionid` has no server-issued equivalent to
/// derive (see `steam_community::session::generate_session_id`'s doc comment), so one is minted
/// the same way `card_farming`'s agent-mode cookie derivation already does.
pub async fn claim_via_agent_session(
    app_handle: &AppHandle,
    steam_id: &str,
    username: &str,
    app_id: u32,
    api_key: Option<String>,
    steam_login_secure: &str,
) -> AppResult<FreeGameClaimOutcome> {
    tracing::info!(steam_id, app_id, "free games: claiming via agent session");
    let session_id = crate::steam_community::session::generate_session_id();
    let cookie_js = format!(
        r#"
        (function() {{
            document.cookie = 'sessionid={session_id}; domain=.steampowered.com; path=/;';
            document.cookie = 'steamLoginSecure={steam_login_secure}; domain=.steampowered.com; path=/;';
        }})();
        "#
    );
    claim_via_store_page(
        app_handle,
        steam_id,
        app_id,
        api_key,
        Some(&cookie_js),
        Some(username),
    )
    .await
}

/// Shared by both sign-in modes' store-page claim path - navigates a hidden window to the app's
/// store page and clicks the "Add to Account" button via injected JS, scoped to
/// `.game_area_purchase_game .btn_addtocart a[href*="addToCart"]` (an unscoped selector risked
/// clicking an unrelated storefront element on a redirected page).
///
/// **Only matches Steam's classic checkout-flow free-license button - doesn't attempt evergreen
/// free-to-play titles** (Lost Ark, The Sims 4, Dota 2, ...). Those titles hand off to the local
/// Steam client via a `steam://` protocol link instead of a web request this webview could
/// observe, so there's no button here to click at all. Not a functional gap in practice:
/// `free_games::discovery`'s scrape only ever surfaces time-limited free promotions, which do use
/// the classic checkout flow.
///
/// **Outcome is verified via the Steam Web API's `GetOwnedGames` after the click, not by reading
/// anything back from the webview** - every attempt at a `document.title`-sentinel signal from the
/// claim page's own JS turned out unreliable for a hidden (`visible: false`) window, so this
/// doesn't try. It fetches the account's real owned-games list
/// (`games::web_api::fetch_owned_games`) and checks whether `app_id` is now present. This also
/// naturally matches CLI mode's lack of a distinct `AlreadyOwned` signal (see
/// `free_games::FreeGameClaimOutcome`'s doc comment): "not newly owned" collapses button-not-found,
/// click-failed, and already-owned into one `Failed` case, since neither mode can distinguish them
/// reliably from this webview-based path.
///
/// **A single `GetOwnedGames` check isn't enough** - Steam's license grant and the Web API backing
/// `GetOwnedGames` aren't necessarily the same immediately-consistent system, so this polls over
/// several seconds (`CLAIM_POLL_DELAYS_MS`, ~45s) rather than checking once. If that still doesn't
/// see the game as owned, a detached background task keeps checking on
/// `CORRECTION_POLL_DELAYS_MS`'s longer tail after this already returned `Failed` - if that later
/// confirms ownership, it emits [`crate::free_games::FREE_GAME_CLAIM_CORRECTED_EVENT`] so the
/// frontend can correct a claim it already told the user had failed.
///
/// `extra_cookie_js`, when present (agent mode only), is merged into the age-bypass
/// `initialization_script` below so the injected session cookies are set under the exact same
/// "must be present before the first request to an age-gated page" constraint the age-bypass
/// cookies already satisfy. `agent_username`, when present, is threaded only into
/// [`spawn_correction_recheck`]'s emitted [`crate::free_games::FreeGameClaimCorrection`] - see that
/// enum's doc comment for why agent-mode accounts need `username`, not `steam_id`, to be matched
/// back up on the frontend.
async fn claim_via_store_page(
    app_handle: &AppHandle,
    steam_id: &str,
    app_id: u32,
    api_key: Option<String>,
    extra_cookie_js: Option<&str>,
    agent_username: Option<&str>,
) -> AppResult<FreeGameClaimOutcome> {
    // Unique per call (not just per steam_id+app_id) - a retried/re-triggered claim for the same
    // app shouldn't risk colliding with a still-tearing-down previous window's label (`close()` is
    // requested async, not guaranteed synchronously torn down by the time a new claim starts).
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or_default();
    let label = format!("store-claim-{steam_id}-{app_id}-{nonce}");
    let data_directory = store_data_dir(app_handle, steam_id)?;
    let url = format!("https://store.steampowered.com/app/{app_id}");
    let target_url: tauri::Url = url
        .parse()
        .map_err(|e| AppError::StoreClaimFailed(format!("invalid app store URL: {e}")))?;

    // Built pointed at the store homepage first, not directly at the target app - age-bypass
    // cookies (via `initialization_script` below) must already be present on the *first* request
    // to an age-gated app's page, since Steam's age check is a server-side redirect decided before
    // any script on that page's own load could set them. Navigating there second, after the
    // homepage has actually set the cookies, avoids the age interstitial.
    let js_set_age_bypass_cookies = r#"
        (function() {
            document.cookie = 'birthtime=0; path=/;';
            document.cookie = 'lastagecheckage=1-0-1970; path=/;';
            document.cookie = 'wants_mature_content=1; path=/;';
        })();
    "#;
    let initialization_script = match extra_cookie_js {
        Some(extra) => format!("{extra}\n{js_set_age_bypass_cookies}"),
        None => js_set_age_bypass_cookies.to_string(),
    };

    let window = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        &label,
        WebviewUrl::External(
            "https://store.steampowered.com/"
                .parse()
                .expect("static URL is always valid"),
        ),
    )
    .title("Claiming Free Game")
    .inner_size(0.0, 0.0)
    .visible(false)
    .data_directory(data_directory)
    .initialization_script(&initialization_script)
    .build()
    .map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    // Long enough for the homepage's own document-start (where the init script above runs) to
    // actually happen - the homepage isn't age-gated itself, so this is just settle time.
    tokio::time::sleep(Duration::from_millis(1500)).await;

    window
        .navigate(target_url)
        .map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    tokio::time::sleep(Duration::from_millis(5000)).await;

    // Best-effort click, not gated on any signal about whether it found or clicked anything - see
    // this function's doc comment for why that signal can't be trusted.
    let js_click = format!(
        r#"
        (function() {{
            try {{
                if (!/^\/app\/{app_id}(\/|$)/.test(window.location.pathname)) {{
                    return;
                }}
                const widget = document.querySelector('.game_area_purchase_game');
                if (!widget) {{
                    return;
                }}
                const target = widget.querySelector('.btn_addtocart a[href*="addToCart"]');
                if (target) {{
                    target.click();
                }}
            }} catch (e) {{
                // Nothing to report to - see this function's doc comment on why outcome detection
                // doesn't rely on anything read back from this script.
            }}
        }})();
        "#
    );

    if let Some(webview) = window.get_webview(&label) {
        let _ = webview.eval(&js_click);
    }

    // Gives Steam's backend a moment to process the grant before the webview is torn down -
    // separate from the longer poll below, which accounts for `GetOwnedGames` itself lagging.
    tokio::time::sleep(Duration::from_millis(2000)).await;

    if let Some(webview) = window.get_webview(&label) {
        let _ = webview.close();
    }
    let _ = window.close();

    // Polls `GetOwnedGames` rather than checking once - Steam's storefront and the Web API backing
    // `GetOwnedGames` aren't necessarily the same immediately-consistent system, so a genuine grant
    // can briefly still read back as not-owned. `poll_owned_games` logs and retries a transient
    // fetch error rather than aborting the whole claim on one failed request - only a persistent
    // failure across every attempt should end up reported as `Failed`.
    if poll_owned_games(steam_id, app_id, api_key.clone(), CLAIM_POLL_DELAYS_MS).await {
        tracing::info!(steam_id, app_id, "free games: claim granted");
        return Ok(FreeGameClaimOutcome::Granted);
    }

    tracing::info!(
        steam_id,
        app_id,
        "free games: claim not granted within the synchronous window - button not found, game \
         not newly owned, or still propagating (see background recheck)"
    );

    spawn_correction_recheck(
        app_handle,
        steam_id.to_string(),
        app_id,
        api_key,
        agent_username.map(str::to_string),
    );

    Ok(FreeGameClaimOutcome::Failed {
        reason: "could not find the Add to Account button - the game may not be free anymore, or is already owned".to_string(),
    })
}

/// Shared by `claim`'s synchronous window and [`spawn_correction_recheck`]'s background tail -
/// checks `GetOwnedGames` once per `delays_ms` entry (plus one immediate check before the first
/// delay), returning `true` the moment `app_id` shows up as owned. A transient fetch error at any
/// single attempt is logged and retried, not treated as a definitive failure - see `claim`'s doc
/// comment for why a flaky single request must not abort the whole polling window.
async fn poll_owned_games(
    steam_id: &str,
    app_id: u32,
    api_key: Option<String>,
    delays_ms: &[u64],
) -> bool {
    for attempt in 0..=delays_ms.len() {
        match games_web_api::fetch_owned_games(steam_id, api_key.clone()).await {
            Ok(owned_now) => {
                if owned_now.games.iter().any(|g| g.appid == app_id) {
                    return true;
                }
            }
            Err(e) => {
                tracing::warn!(
                    steam_id,
                    app_id,
                    attempt,
                    error = %e.code(),
                    "free games: ownership check failed, retrying"
                );
            }
        }
        if let Some(&delay_ms) = delays_ms.get(attempt) {
            tokio::time::sleep(Duration::from_millis(delay_ms)).await;
        }
    }
    false
}

/// Detached tail recheck for the rare case where `claim_via_store_page`'s already-extended
/// synchronous window still wasn't enough - keeps polling `GetOwnedGames` on
/// `CORRECTION_POLL_DELAYS_MS`'s much longer schedule well after that already returned `Failed` to
/// its caller. If ownership shows up late, this is the only remaining way to tell the frontend the
/// truth: it emits [`FREE_GAME_CLAIM_CORRECTED_EVENT`] rather than leaving the already-delivered
/// `Failed` outcome uncorrected. Never blocks the caller's own return.
///
/// `agent_username` is `Some` only for [`claim_via_agent_session`]'s callers - it selects which
/// tagged [`FreeGameClaimCorrection`] variant to emit (see that enum's doc comment for why agent
/// mode needs `username` instead of `steam_id` to be matched back up on the frontend).
fn spawn_correction_recheck(
    app_handle: &AppHandle,
    steam_id: String,
    app_id: u32,
    api_key: Option<String>,
    agent_username: Option<String>,
) {
    let app_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        if poll_owned_games(&steam_id, app_id, api_key, CORRECTION_POLL_DELAYS_MS).await {
            tracing::info!(
                steam_id,
                app_id,
                "free games: claim corrected - game was actually granted after the initial \
                 synchronous check reported failure"
            );
            let correction = match agent_username {
                Some(username) => FreeGameClaimCorrection::Agent { username, app_id },
                None => FreeGameClaimCorrection::Local { steam_id, app_id },
            };
            let _ = app_handle.emit(FREE_GAME_CLAIM_CORRECTED_EVENT, correction);
        } else {
            tracing::info!(
                steam_id,
                app_id,
                "free games: claim correction recheck also found the game not owned - treating \
                 the original Failed outcome as final"
            );
        }
    });
}
