//! Anonymous scrape of the Steam store's free-games search results - no auth, no account, works
//! identically for both sign-in modes. Ported from `main`'s `game_data::get_free_games`, same
//! URL/selectors, moved off `main`'s ad hoc `Value`/`GameInfo` shape onto this module's
//! `FreeGameEntry`.

use reqwest::Client;
use scraper::{Html, Selector};

use crate::error::{AppError, AppResult};

use super::FreeGameEntry;

const SEARCH_URL: &str =
    "https://store.steampowered.com/search/?l=english&maxprice=free&specials=1&category1=998";

pub async fn discover() -> AppResult<Vec<FreeGameEntry>> {
    let client = Client::new();
    let response = client
        .get(SEARCH_URL)
        .send()
        .await
        .map_err(|e| AppError::FreeGamesScrapeFailed(e.to_string()))?;

    let html = response
        .text()
        .await
        .map_err(|e| AppError::FreeGamesScrapeFailed(e.to_string()))?;

    let document = Html::parse_document(&html);
    // Both selectors are static, valid CSS - unwrap is fine, a parse failure here would be a typo
    // in this file, not a runtime condition.
    let row_selector = Selector::parse("a.search_result_row").unwrap();
    let title_selector = Selector::parse("span.title").unwrap();

    let mut games = Vec::new();
    for row in document.select(&row_selector) {
        let Some(app_id_str) = row.value().attr("data-ds-appid") else {
            continue;
        };
        let Ok(app_id) = app_id_str.parse::<u32>() else {
            continue;
        };
        let Some(title_element) = row.select(&title_selector).next() else {
            continue;
        };

        let name = title_element.text().collect::<String>().trim().to_string();
        games.push(FreeGameEntry { app_id, name });
    }

    tracing::info!(count = games.len(), "free games: discovered");
    Ok(games)
}
