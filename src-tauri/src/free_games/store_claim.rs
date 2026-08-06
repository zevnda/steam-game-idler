//! Mode-agnostic engine for claiming a temporarily-free (100%-discounted) Steam promo directly via
//! Steam's own store checkout endpoint - `store.steampowered.com/freelicense/addfreelicense`
//! (`subId` goes in the POST body, not the URL - see [`submit_add_free_license`]'s doc comment),
//! the same mechanism the store website's own "Add to Cart"/claim button drives. Shared by both
//! sign-in modes' claim paths (`local_steam::free_game_claim` for CLI mode,
//! `steam_agent::AgentManager` for agent mode) - lives here under `free_games/`, the neutral module
//! both already depend on, rather than under either mode-specific module (either direction would
//! be a circular dependency).
//!
//! This endpoint claims a *package* (sub id), not an app id - [`resolve_sub_id`] finds the sub id
//! an app's store page currently advertises for its purchase widget, the same one the storefront's
//! own "Add to Cart" button targets. Steam's classic `RequestFreeLicense` network opcode (SteamKit2)
//! only grants genuine "Free on Demand" packages and can never grant one of these - see
//! `steam_agent::AgentManager::claim_free_game`'s doc comment for why it's not attempted at all.
//!
//! The response is an undocumented HTML page, not JSON - success is signaled by a
//! `<h2>Success!</h2>` marker, failure by a `<span class="error">...</span>` block (see
//! [`submit_add_free_license`]'s doc comment). Neither is treated as the sole source of truth -
//! the authoritative signal is always each mode's own authenticated ownership check, passed in as
//! `check_owned`.

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::Duration;

use scraper::{Html, Selector};
use tauri::{AppHandle, Emitter};

use crate::error::{AppError, AppResult};
use crate::free_games::{
    FreeGameClaimCorrection, FreeGameClaimOutcome, FREE_GAME_CLAIM_CORRECTED_EVENT,
};

const STEAM_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/// Age-gate bypass, mirrors what the former hidden-webview claim flow set before its first
/// navigation - some free promos sit on mature-rated app pages that redirect to an age
/// confirmation interstitial without these, hiding the purchase widget [`resolve_sub_id`] needs.
const AGE_BYPASS_COOKIES: &str = "birthtime=0; lastagecheckage=1-0-1970; wants_mature_content=1";

/// Short synchronous confirmation window - sparse compared to the ~45s/10-attempt poll this
/// replaces, since `check_owned` here is each mode's own authenticated ownership probe, meaningfully
/// more expensive per call (a full PICS sweep / a subprocess spawn) than the single lightweight
/// public Web API call it replaces.
const CONFIRM_POLL_DELAYS_MS: &[u64] = &[1500, 3000];

/// Background tail recheck schedule for the rare case the synchronous window above still hasn't
/// confirmed ownership - mirrors the previous claim flow's correction-recheck shape, just sparser
/// for the same reason as [`CONFIRM_POLL_DELAYS_MS`].
const CORRECTION_POLL_DELAYS_MS: &[u64] = &[15000, 30000, 45000];

/// An authenticated, privacy-independent "does this account own `app_id`" probe, supplied by the
/// caller (agent mode: `AgentManager::get_owned_apps`; CLI mode:
/// `local_steam::ownership::check_ownership`). `Arc`'d rather than passed by reference so it can be
/// cheaply reused across the pre-check, the synchronous confirmation, and a detached background
/// recheck task without re-threading lifetimes through all three.
pub type OwnershipCheck =
    Arc<dyn Fn() -> Pin<Box<dyn Future<Output = AppResult<bool>> + Send>> + Send + Sync>;

fn steam_client() -> reqwest::Result<reqwest::Client> {
    reqwest::Client::builder()
        .user_agent(STEAM_USER_AGENT)
        .build()
}

/// Full mode-agnostic claim orchestration for `app_id`: an upfront `check_owned` pre-check (skips
/// the network claim entirely if already owned - this is what finally gives CLI mode a reliable
/// `AlreadyOwned` signal too, unlike the former webview-click flow which could never distinguish it
/// from a successful claim - see `FreeGameClaimOutcome::AlreadyOwned`'s doc comment), then the
/// direct claim POST, then confirmation via the same check.
pub async fn claim_via_direct_post(
    app_handle: &AppHandle,
    account: &str,
    app_id: u32,
    cookie_header: &str,
    session_id: &str,
    correction: FreeGameClaimCorrection,
    check_owned: OwnershipCheck,
) -> AppResult<FreeGameClaimOutcome> {
    if poll_owned(&check_owned, &[]).await {
        tracing::info!(account, app_id, "free games: already owned, skipping claim");
        return Ok(FreeGameClaimOutcome::AlreadyOwned);
    }

    let post_response = attempt_direct_claim(cookie_header, session_id, app_id).await?;
    Ok(verify_and_finalize(
        app_handle,
        account,
        app_id,
        post_response,
        correction,
        check_owned,
    )
    .await)
}

/// Resolves `app_id`'s current sub id then submits the claim - split out from
/// [`claim_via_direct_post`] so a caller that already knows it isn't already-owned (there is none
/// today, but keeps the two concerns separable) could skip the pre-check.
async fn attempt_direct_claim(
    cookie_header: &str,
    session_id: &str,
    app_id: u32,
) -> AppResult<AddFreeLicenseResponse> {
    let sub_id = resolve_sub_id(cookie_header, app_id).await?;
    submit_add_free_license(cookie_header, session_id, sub_id).await
}

/// Finds the package (sub) id `app_id`'s store page currently advertises for its purchase widget -
/// what [`submit_add_free_license`] actually operates on. Fetched fresh on every claim (rather than
/// trusting `free_games::discovery`'s scrape, which has no sub-id concept at all - see that
/// module's doc comment) since a promo's sub id isn't derivable from its app id alone.
///
/// Tries each known candidate shape in turn and logs which one matched, rather than committing to
/// a single selector - the page's exact markup for this isn't documented by Valve, and different
/// promo types may render the purchase widget slightly differently.
async fn resolve_sub_id(cookie_header: &str, app_id: u32) -> AppResult<u32> {
    let client = steam_client().map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;
    let url = format!("https://store.steampowered.com/app/{app_id}");

    let response = client
        .get(&url)
        .header("Cookie", format!("{cookie_header}; {AGE_BYPASS_COOKIES}"))
        .send()
        .await
        .map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    let html = response
        .text()
        .await
        .map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    match extract_sub_id(&html) {
        Some((sub_id, matched_via)) => {
            tracing::info!(
                app_id,
                sub_id,
                matched_via,
                "free games: resolved sub id from store page"
            );
            Ok(sub_id)
        }
        None => {
            // The page's exact purchase-widget markup isn't documented by Valve and can plausibly
            // vary by promo type - on a miss, log enough about the fetched page to tell whether the
            // widget was present at all (a markup mismatch worth fixing) versus the page never
            // rendering one in the first place (an age gate/redirect/already-claimed page instead -
            // not a selector bug). Not the full HTML - could be very large, and may reflect session
            // state back in inline script - just structural signals.
            let has_purchase_widget = html.contains("game_area_purchase_game");
            let page_title = Selector::parse("title").ok().and_then(|selector| {
                Html::parse_document(&html)
                    .select(&selector)
                    .next()
                    .map(|el| el.text().collect::<String>())
            });
            tracing::warn!(
                app_id,
                html_len = html.len(),
                has_purchase_widget,
                ?page_title,
                "free games: could not resolve a sub id from the store page - selectors may need \
                 updating, or the page never rendered a purchase widget at all"
            );
            Err(AppError::StoreClaimFailed(format!(
                "could not find a purchasable package id on the store page for app {app_id} - the game may not be free anymore, or is already owned"
            )))
        }
    }
}

fn extract_sub_id(html: &str) -> Option<(u32, &'static str)> {
    let document = Html::parse_document(html);

    // Candidate 1: a hidden form input Steam's purchase widget commonly renders
    // (`<input name="subid" value="...">`).
    if let Ok(selector) = Selector::parse(r#"input[name="subid"]"#) {
        if let Some(sub_id) = document
            .select(&selector)
            .find_map(|el| el.value().attr("value")?.parse().ok())
        {
            return Some((sub_id, "subid_input"));
        }
    }

    // Candidate 2: the purchase widget's "Add to Cart" anchor - the same element the former
    // webview-click flow targeted by CSS selector alone, just read here instead of clicked. The
    // sub id shows up either as a `subid=` query param or as an argument to an inline
    // `GameApp_AddToCart(<subid>, ...)`-style onclick handler.
    if let Ok(selector) = Selector::parse(
        r#".game_area_purchase_game a[href*="cart"], .game_area_purchase_game a[onclick*="AddToCart"]"#,
    ) {
        for el in document.select(&selector) {
            let attrs = [el.value().attr("href"), el.value().attr("onclick")];
            if let Some(sub_id) = attrs.into_iter().flatten().find_map(extract_first_number) {
                return Some((sub_id, "purchase_widget_anchor"));
            }
        }
    }

    None
}

/// Pulls the first run of ASCII digits out of `text` - used against an anchor's `href`/`onclick`
/// attribute, whose exact surrounding syntax (`subid=123`, `AddToCart(123,...)`, `.../123/...`)
/// isn't pinned down by any Valve documentation.
fn extract_first_number(text: &str) -> Option<u32> {
    let mut digits = String::new();
    for ch in text.chars() {
        if ch.is_ascii_digit() {
            digits.push(ch);
        } else if !digits.is_empty() {
            break;
        }
    }
    digits.parse().ok()
}

/// Raw, tolerant result of one `addfreelicense` POST - deliberately not collapsed into
/// `FreeGameClaimOutcome` here, since this response shape is inconsistent (see this module's doc
/// comment). Callers combine this with their own mode's authenticated ownership check rather than
/// trusting it alone.
#[derive(Debug)]
struct AddFreeLicenseResponse {
    html_success_marker: bool,
    reported_error: Option<String>,
}

/// POSTs `store.steampowered.com/freelicense/addfreelicense` - the same endpoint Steam's own
/// store-page "Add to Cart"/claim button drives for a free/100%-discounted package, callable
/// directly with session cookies instead of driving a hidden browser window to click it. `sub_id`
/// is a form field, not a URL path segment - a path-segment variant 404s against the real
/// endpoint, since this route doesn't accept one.
///
/// Returns an HTML page, not JSON - confirmed live against a real claim. Success is signaled by a
/// `<h2>Success!</h2>` marker in the response body; failure by a `<span class="error">...</span>`
/// block. Neither is treated as fully authoritative on its own - see this module's doc comment.
async fn submit_add_free_license(
    cookie_header: &str,
    session_id: &str,
    sub_id: u32,
) -> AppResult<AddFreeLicenseResponse> {
    let client = steam_client().map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    let response = client
        .post("https://store.steampowered.com/freelicense/addfreelicense")
        .header("Cookie", cookie_header)
        .form(&[
            ("action", "add_to_cart"),
            ("sessionid", session_id),
            ("subid", &sub_id.to_string()),
        ])
        .send()
        .await
        .map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    let http_status = response.status().as_u16();
    let raw_body = response
        .text()
        .await
        .map_err(|e| AppError::StoreClaimFailed(e.to_string()))?;

    let html_success_marker = raw_body.contains("<h2>Success!</h2>");
    let reported_error = extract_error_span(&raw_body);

    tracing::info!(
        sub_id,
        http_status,
        html_success_marker,
        reported_error = ?reported_error,
        body_len = raw_body.len(),
        "free games: addfreelicense response"
    );

    // This endpoint's response shape is undocumented by Valve and not guaranteed stable - if
    // neither known marker matches, log a snippet of what actually came back so a future mismatch
    // (Steam changing the page, a new promo type, ...) is diagnosable from one occurrence instead
    // of needing a dedicated live reproduction. Not logged unconditionally - the success path's
    // body is a full page, with no reason to pay that log-file cost on every ordinary claim.
    if !html_success_marker && reported_error.is_none() {
        let snippet: String = raw_body.chars().take(1000).collect();
        tracing::warn!(
            sub_id,
            http_status,
            snippet,
            "free games: addfreelicense response matched neither the success nor error marker - \
             logging a snippet to diagnose without spending another live claim attempt"
        );
    }

    Ok(AddFreeLicenseResponse {
        html_success_marker,
        reported_error,
    })
}

/// Pulls the message out of Steam's `<span class="error">...</span>` failure marker, if present -
/// the HTML-response counterpart to the JSON `error` field some other Steam endpoints use.
fn extract_error_span(html: &str) -> Option<String> {
    const OPEN_TAG: &str = r#"<span class="error">"#;
    let start = html.find(OPEN_TAG)? + OPEN_TAG.len();
    let end = html[start..].find("</span>")? + start;
    Some(html[start..end].trim().to_string())
}

/// Interprets `post_response` and confirms via `check_owned`. Polls sparingly
/// ([`CONFIRM_POLL_DELAYS_MS`]) rather than trusting a single call, since a real grant isn't always
/// immediately reflected even by an authenticated check. If still unconfirmed after that, spawns a
/// longer, sparser background recheck ([`CORRECTION_POLL_DELAYS_MS`]) that emits `correction` via
/// `FREE_GAME_CLAIM_CORRECTED_EVENT` if it eventually confirms ownership - never blocks the
/// caller's own return.
async fn verify_and_finalize(
    app_handle: &AppHandle,
    account: &str,
    app_id: u32,
    post_response: AddFreeLicenseResponse,
    correction: FreeGameClaimCorrection,
    check_owned: OwnershipCheck,
) -> FreeGameClaimOutcome {
    if poll_owned(&check_owned, CONFIRM_POLL_DELAYS_MS).await {
        tracing::info!(account, app_id, "free games: claim confirmed owned");
        return FreeGameClaimOutcome::Granted;
    }

    tracing::info!(
        account,
        app_id,
        html_success_marker = post_response.html_success_marker,
        reported_error = ?post_response.reported_error,
        "free games: claim not confirmed within the synchronous window - spawning background recheck"
    );

    spawn_correction_recheck(
        app_handle.clone(),
        account.to_string(),
        app_id,
        correction,
        check_owned,
    );

    FreeGameClaimOutcome::Failed {
        reason: post_response.reported_error.unwrap_or_else(|| {
            "could not confirm the game was added to your library - the game may not be free \
             anymore, or is already owned"
                .to_string()
        }),
    }
}

/// Shared by the pre-check (empty `delays_ms` - a single immediate check), the synchronous
/// confirmation window, and the background correction recheck. A transient check failure is logged
/// and retried, not treated as definitive - mirrors the previous claim flow's identical reasoning
/// for a flaky single request.
async fn poll_owned(check_owned: &OwnershipCheck, delays_ms: &[u64]) -> bool {
    for attempt in 0..=delays_ms.len() {
        match check_owned().await {
            Ok(true) => return true,
            Ok(false) => {}
            Err(e) => {
                tracing::warn!(attempt, error = %e.code(), "free games: ownership check failed, retrying");
            }
        }
        if let Some(&delay_ms) = delays_ms.get(attempt) {
            tokio::time::sleep(Duration::from_millis(delay_ms)).await;
        }
    }
    false
}

fn spawn_correction_recheck(
    app_handle: AppHandle,
    account: String,
    app_id: u32,
    correction: FreeGameClaimCorrection,
    check_owned: OwnershipCheck,
) {
    tauri::async_runtime::spawn(async move {
        if poll_owned(&check_owned, CORRECTION_POLL_DELAYS_MS).await {
            tracing::info!(
                account,
                app_id,
                "free games: claim corrected - confirmed owned after the initial window couldn't confirm it"
            );
            let _ = app_handle.emit(FREE_GAME_CLAIM_CORRECTED_EVENT, correction);
        } else {
            tracing::info!(
                account,
                app_id,
                "free games: correction recheck also could not confirm ownership - treating the \
                 original outcome as final"
            );
        }
    });
}
