//! Card-drop scraping via cookie-authenticated requests to `steamcommunity.com` - a plain
//! `reqwest` client, not the session-acquisition webview's own cookie jar (see
//! `steam_community::session`'s doc comment on why the literal cookie values matter here). Ported
//! from `main`'s `get_drops_remaining`/`get_games_with_drops`, same URLs/selectors/regexes, typed
//! onto this module's `DropsRemaining`/`GameWithDrops` instead of ad hoc `serde_json::Value`.

use futures::future::join_all;
use regex::Regex;
use scraper::selectable::Selectable;
use scraper::{Html, Selector};

use crate::error::{AppError, AppResult};
use crate::steam_community::session::is_session_revoked;
use crate::steam_community::{cookie_header, steam_client};

use super::{DropsRemaining, GameWithDrops, SteamCookies};

/// Extracts "N.N hrs on record" from a `.badge_title_stats_playtime` element - generic over
/// `Html`/`ElementRef` via `scraper::Selectable` since this needs to run both on a whole document
/// (`get_drops_remaining`, one game's own page) and scoped to a single `.badge_row`
/// (`get_games_with_drops`, one row per game on a shared overview page).
fn extract_playtime_hours<'a>(root: impl Selectable<'a>) -> f32 {
    let selector = Selector::parse(".badge_title_stats_playtime").unwrap();
    let Some(text) = root
        .select(&selector)
        .next()
        .map(|e| e.text().collect::<String>().trim().to_string())
    else {
        return 0.0;
    };
    if text.is_empty() {
        return 0.0;
    }

    let regex = Regex::new(r"([\d.]+)\s*hrs? on record").unwrap();
    regex
        .captures(&text)
        .and_then(|cap| cap[1].parse::<f32>().ok())
        .unwrap_or(0.0)
}

/// Card drops remaining + playtime for one game, from that game's own badge page. Both "no drops
/// remaining" and "drops data not found on this page at all" (e.g. a game with no trading cards)
/// collapse to `remaining: 0` - `main`'s own frontend already treated these identically
/// (`handleAutomation.ts`'s `checkDrops` falls back to `0` on anything other than a populated
/// `remaining` field), so no real distinction is being thrown away by not modeling a separate
/// "not found" case here.
pub async fn get_drops_remaining(
    steam_id: &str,
    app_id: u32,
    cookies: &SteamCookies,
) -> AppResult<DropsRemaining> {
    let client = steam_client().map_err(|e| AppError::CardFarmingScrapeFailed(e.to_string()))?;
    let response = client
        .get(format!(
            "https://steamcommunity.com/profiles/{steam_id}/gamecards/{app_id}/?l=english"
        ))
        .header("Cookie", cookie_header(steam_id, cookies))
        .send()
        .await
        .map_err(|e| AppError::CardFarmingScrapeFailed(e.to_string()))?;

    // Checked before consuming the response body: a dead session serves a login/redirect page
    // whose selectors just silently don't match below, degrading to a false "0 remaining" instead
    // of the real cause - see `session::is_session_revoked`'s doc comment on why this specific
    // signal is safe to trust on a single response, unlike `validate`'s other marker.
    if is_session_revoked(&response) {
        return Err(AppError::SteamCommunitySessionExpired(steam_id.to_string()));
    }

    let html = response
        .text()
        .await
        .map_err(|e| AppError::CardFarmingScrapeFailed(e.to_string()))?;
    let document = Html::parse_document(&html);
    let playtime_hours = extract_playtime_hours(&document);

    let progress_selector = Selector::parse(".progress_info_bold").unwrap();
    let Some(element) = document.select(&progress_selector).next() else {
        return Ok(DropsRemaining {
            remaining: 0,
            playtime_hours,
        });
    };

    let text = element.text().collect::<String>();
    if text.contains("No card drops remaining") {
        return Ok(DropsRemaining {
            remaining: 0,
            playtime_hours,
        });
    }

    let regex = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").unwrap();
    let remaining = regex
        .captures(&text)
        .and_then(|cap| cap[1].parse::<u32>().ok())
        .unwrap_or(0);

    Ok(DropsRemaining {
        remaining,
        playtime_hours,
    })
}

fn detect_max_page(html: &str) -> usize {
    let document = Html::parse_document(html);
    let page_links_selector = Selector::parse(".pageLinks").unwrap();
    let pagelink_selector = Selector::parse(".pagelink").unwrap();
    document
        .select(&page_links_selector)
        .next()
        .map(|page_links| {
            page_links
                .select(&pagelink_selector)
                .filter_map(|link| link.text().next()?.trim().parse::<usize>().ok())
                .max()
                .unwrap_or(1)
        })
        .unwrap_or(1)
}

fn parse_games_with_drops(html: &str) -> Vec<GameWithDrops> {
    let document = Html::parse_document(html);
    let badge_row_selector = Selector::parse(".badge_row").unwrap();
    let progress_info_bold_selector = Selector::parse(".progress_info_bold").unwrap();
    let badge_title_selector = Selector::parse(".badge_title").unwrap();
    let app_link_selector = Selector::parse(".btn_green_white_innerfade").unwrap();
    let regex = Regex::new(r"(\d+)\s+card\s+drop(?:s)?\s+remaining").unwrap();

    let mut games = Vec::new();
    for badge_row in document.select(&badge_row_selector) {
        let Some(progress_info) = badge_row.select(&progress_info_bold_selector).next() else {
            continue;
        };
        let progress_text = progress_info.text().collect::<String>();
        let Some(captures) = regex.captures(&progress_text) else {
            continue;
        };
        let Some(remaining) = captures[1].parse::<u32>().ok() else {
            continue;
        };

        // `steam://run/{appId}` is the only place a game's app id appears on this page - skip the
        // row entirely if it's missing or unparseable rather than fabricating a placeholder id.
        let Some(app_id) = badge_row
            .select(&app_link_selector)
            .next()
            .and_then(|e| e.value().attr("href"))
            .and_then(|href| href.strip_prefix("steam://run/"))
            .and_then(|id| id.trim_end_matches('/').parse::<u32>().ok())
        else {
            continue;
        };

        let name = badge_row
            .select(&badge_title_selector)
            .next()
            .map(|e| e.text().collect::<String>().trim().to_string())
            .unwrap_or_default();
        let name = name.replace("View details", "").trim().to_string();

        let playtime_hours = extract_playtime_hours(badge_row);

        games.push(GameWithDrops {
            app_id,
            name,
            remaining,
            playtime_hours,
        });
    }
    games
}

/// Every owned game with at least one card drop remaining, scraped from the account's badge
/// overview pages (paginated - fetches page 1 first to discover the real page count via
/// `detect_max_page`, then fetches the rest concurrently, mirroring `main`'s `join_all` shape). A
/// single page's request failure is skipped rather than failing the whole call, same as `main` -
/// except page 1 specifically, which also errors the whole call with
/// `AppError::SteamCommunitySessionExpired` if the session turns out to be dead (see
/// `is_session_revoked`), rather than silently returning an empty/partial games list that would
/// look like "nothing left to farm".
pub async fn get_games_with_drops(
    steam_id: &str,
    cookies: &SteamCookies,
) -> AppResult<Vec<GameWithDrops>> {
    let client = steam_client().map_err(|e| AppError::CardFarmingScrapeFailed(e.to_string()))?;
    let cookie_value = cookie_header(steam_id, cookies);
    let page_url = |page: usize| {
        format!("https://steamcommunity.com/profiles/{steam_id}/badges/?l=english&sort=p&p={page}")
    };

    let first_page_response = client
        .get(page_url(1))
        .header("Cookie", cookie_value.clone())
        .send()
        .await
        .map_err(|e| AppError::CardFarmingScrapeFailed(e.to_string()))?;

    // Checked only on page 1: pagination viability is decided from this page, and if the session
    // is dead it's dead account-wide, so there's no need to repeat this per page. Pages 2+ keep
    // their existing best-effort `Vec::new()` degradation on any failure, untouched.
    if is_session_revoked(&first_page_response) {
        return Err(AppError::SteamCommunitySessionExpired(steam_id.to_string()));
    }

    let first_page_html = first_page_response
        .text()
        .await
        .map_err(|e| AppError::CardFarmingScrapeFailed(e.to_string()))?;

    let max_page = detect_max_page(&first_page_html);
    let mut games = parse_games_with_drops(&first_page_html);
    tracing::debug!(
        steam_id,
        max_page,
        page_1_matches = games.len(),
        html_len = first_page_html.len(),
        "card farming: scraped badge overview page 1"
    );

    if max_page > 1 {
        let remaining_pages = (2..=max_page).map(|page| {
            let client = client.clone();
            let cookie_value = cookie_value.clone();
            let url = page_url(page);
            async move {
                let Ok(response) = client.get(url).header("Cookie", cookie_value).send().await
                else {
                    return Vec::new();
                };
                match response.text().await {
                    Ok(html) => parse_games_with_drops(&html),
                    Err(_) => Vec::new(),
                }
            }
        });

        for page_games in join_all(remaining_pages).await {
            games.extend(page_games);
        }
    }

    Ok(games)
}
