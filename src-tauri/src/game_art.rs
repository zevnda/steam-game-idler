//! Resolves each game's portrait (600x900) and wide hero art through Steam's public store API.
//!
//! `steam/apps/<id>/library_600x900.jpg` can't be relied on by itself: many games now serve their
//! portrait art from a content-hashed path, and some under a different filename altogether
//! (`<hash>/library_capsule.jpg`), neither of which can be guessed from the app id. In a sample of
//! 600 real library entries the guessable URL worked for 85%, and this lookup raised that to 96%.
//! `IStoreBrowseService/GetItems` is unauthenticated and keyed only by app id, so every install
//! calls it directly, with no embedded key and no project-run service between it and Steam.
//!
//! Results are cached app-wide rather than per account, since store art doesn't depend on who is
//! signed in. Failing to reach Steam is never an error to the caller: those ids are just left out
//! of the result and retried on the next call, and the frontend falls back to guessable URLs (see
//! `GamePosterArt.tsx`).

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::fs_utils::atomic_write_json;
use crate::platform;

const CACHE_FILE_NAME: &str = "game_assets.json";
const STORE_ITEMS_URL: &str = "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/";
// `asset_url_format` is relative to this host. The hashed paths 404 on
// `cdn.cloudflare.steamstatic.com`, which the rest of the app uses for plain `header.jpg` URLs.
const ASSET_BASE_URL: &str = "https://shared.fastly.steamstatic.com/store_item_assets/";
const BATCH_SIZE: usize = 100;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
// Art changes rarely, and a stale URL only costs a fall through the frontend's fallback chain until
// it expires. A game with no portrait is rechecked sooner, since developers do add them later.
const FOUND_TTL_SECS: u64 = 30 * 24 * 60 * 60;
const MISSING_TTL_SECS: u64 = 7 * 24 * 60 * 60;

// Held only around the cache file's read-modify-write, never across the network requests, so a slow
// Steam response can't hold up lookups that the cache could answer straight away.
static CACHE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// A game's art URLs, each `None` when Steam has none of that kind for it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct GameArt {
    portrait: Option<String>,
    hero: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CachedArt {
    #[serde(flatten)]
    art: GameArt,
    fetched_at: u64,
}

type ArtCache = HashMap<u32, CachedArt>;

#[derive(Debug, Deserialize)]
struct GetItemsResponse {
    #[serde(default)]
    response: GetItemsInner,
}

#[derive(Debug, Default, Deserialize)]
struct GetItemsInner {
    #[serde(default)]
    store_items: Vec<StoreItem>,
}

#[derive(Debug, Deserialize)]
struct StoreItem {
    // A delisted or unknown id still gets an entry back, but with this as 0 and no assets, which
    // is why the request's ids are the source of truth for "looked up, nothing found" below.
    #[serde(default)]
    appid: u32,
    #[serde(default)]
    assets: Option<StoreAssets>,
}

#[derive(Debug, Deserialize)]
struct StoreAssets {
    asset_url_format: Option<String>,
    library_capsule: Option<String>,
    library_hero: Option<String>,
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_secs())
        .unwrap_or(0)
}

fn is_fresh(entry: &CachedArt, now: u64) -> bool {
    let ttl = if entry.art.portrait.is_some() {
        FOUND_TTL_SECS
    } else {
        MISSING_TTL_SECS
    };
    now.saturating_sub(entry.fetched_at) < ttl
}

fn asset_url(assets: &StoreAssets, filename: Option<&str>) -> Option<String> {
    let format = assets.asset_url_format.as_deref()?;
    Some(format!(
        "{ASSET_BASE_URL}{}",
        format.replace("${FILENAME}", filename?)
    ))
}

fn art_from_assets(assets: &StoreAssets) -> GameArt {
    GameArt {
        portrait: asset_url(assets, assets.library_capsule.as_deref()),
        hero: asset_url(assets, assets.library_hero.as_deref()),
    }
}

fn cache_path(app_handle: &AppHandle) -> AppResult<PathBuf> {
    Ok(platform::cache_dir(app_handle)?.join(CACHE_FILE_NAME))
}

// A corrupt file only loses resolved URLs that can be fetched again, so it self-heals to empty
// instead of failing every lookup for this user.
fn read_cache(path: &PathBuf) -> ArtCache {
    let contents = match fs::read_to_string(path) {
        Ok(contents) => contents,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return ArtCache::new(),
        Err(e) => {
            tracing::warn!(error = %e, "game art: failed to read cache, starting empty");
            return ArtCache::new();
        }
    };
    serde_json::from_str(&contents).unwrap_or_else(|e| {
        tracing::warn!(error = %e, "game art: cache unreadable, starting empty");
        ArtCache::new()
    })
}

async fn fetch_batch(client: &Client, app_ids: &[u32]) -> AppResult<HashMap<u32, GameArt>> {
    let ids: Vec<_> = app_ids
        .iter()
        .map(|app_id| serde_json::json!({ "appid": app_id }))
        .collect();
    let input = serde_json::json!({
        "ids": ids,
        "context": { "language": "english", "country_code": "US" },
        "data_request": { "include_assets": true },
    });

    let body: GetItemsResponse = client
        .get(STORE_ITEMS_URL)
        .query(&[("input_json", input.to_string())])
        .timeout(REQUEST_TIMEOUT)
        .send()
        .await
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?
        .error_for_status()
        .map_err(|e| AppError::SteamApiRequest(e.to_string()))?
        .json()
        .await
        .map_err(|e| AppError::SteamApiResponse(e.to_string()))?;

    Ok(results_for_batch(app_ids, body.response.store_items))
}

// Every requested id gets an entry, empty when Steam has no art for it, so a game without any is
// remembered instead of being looked up again every time its card renders.
fn results_for_batch(app_ids: &[u32], items: Vec<StoreItem>) -> HashMap<u32, GameArt> {
    let mut results: HashMap<u32, GameArt> = app_ids
        .iter()
        .map(|app_id| (*app_id, GameArt::default()))
        .collect();
    for item in items {
        if let (Some(entry), Some(assets)) = (results.get_mut(&item.appid), &item.assets) {
            *entry = art_from_assets(assets);
        }
    }
    results
}

/// Returns each id's art URLs. An id is left out entirely if Steam couldn't be reached for it, which
/// the frontend treats as "try the fallbacks".
#[tauri::command]
pub async fn resolve_game_art(
    app_handle: AppHandle,
    app_ids: Vec<u32>,
) -> AppResult<HashMap<u32, GameArt>> {
    let path = cache_path(&app_handle)?;
    let now = now_secs();

    let cached = {
        let _guard = CACHE_LOCK.lock().await;
        read_cache(&path)
    };

    let mut results = HashMap::with_capacity(app_ids.len());
    let mut missing = Vec::new();
    for app_id in app_ids {
        match cached.get(&app_id) {
            Some(entry) if is_fresh(entry, now) => {
                results.insert(app_id, entry.art.clone());
            }
            _ => missing.push(app_id),
        }
    }
    if missing.is_empty() {
        return Ok(results);
    }

    let client = Client::new();
    let mut fetched = HashMap::with_capacity(missing.len());
    for batch in missing.chunks(BATCH_SIZE) {
        match fetch_batch(&client, batch).await {
            Ok(batch_results) => fetched.extend(batch_results),
            Err(e) => {
                tracing::warn!(error = %e, count = batch.len(), "game art: batch lookup failed");
            }
        }
    }
    if fetched.is_empty() {
        return Ok(results);
    }

    let found = fetched
        .values()
        .filter(|art| art.portrait.is_some())
        .count();
    tracing::info!(
        requested = missing.len(),
        found,
        "game art: resolved portrait art from the Steam store"
    );

    {
        // Re-read rather than reuse `cached`, so another lookup's results that landed during the
        // requests above aren't overwritten.
        let _guard = CACHE_LOCK.lock().await;
        let mut cache = read_cache(&path);
        for (app_id, art) in &fetched {
            cache.insert(
                *app_id,
                CachedArt {
                    art: art.clone(),
                    fetched_at: now,
                },
            );
        }
        if let Err(e) = atomic_write_json(&path, &cache) {
            tracing::warn!(error = %e, "game art: failed to write cache");
        }
    }

    results.extend(fetched);
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assets(format: Option<&str>, capsule: Option<&str>, hero: Option<&str>) -> StoreAssets {
        StoreAssets {
            asset_url_format: format.map(String::from),
            library_capsule: capsule.map(String::from),
            library_hero: hero.map(String::from),
        }
    }

    #[test]
    fn builds_hashed_asset_urls() {
        let art = art_from_assets(&assets(
            Some("steam/apps/570/${FILENAME}?t=1791407503"),
            Some("6cddc26c/library_capsule.jpg"),
            Some("0e4a18e7/library_hero.jpg"),
        ));
        let base = "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/570";
        assert_eq!(
            art.portrait,
            Some(format!("{base}/6cddc26c/library_capsule.jpg?t=1791407503"))
        );
        assert_eq!(
            art.hero,
            Some(format!("{base}/0e4a18e7/library_hero.jpg?t=1791407503"))
        );
    }

    #[test]
    fn a_missing_asset_or_format_leaves_that_url_empty() {
        let art = art_from_assets(&assets(
            Some("steam/apps/1/${FILENAME}"),
            None,
            Some("h.jpg"),
        ));
        assert_eq!(art.portrait, None);
        assert!(art.hero.is_some());
        assert_eq!(
            art_from_assets(&assets(None, Some("c.jpg"), Some("h.jpg"))),
            GameArt::default()
        );
    }

    #[test]
    fn delisted_ids_are_remembered_as_having_no_art() {
        // The real response shape: a delisted id comes back with `appid` zeroed, so it can't be
        // matched to anything in the batch (its `id` field is a different identifier space).
        let body: GetItemsResponse = serde_json::from_str(
            r#"{"response":{"store_items":[
                {"item_type":0,"id":480,"success":15,"visible":false,"appid":0},
                {"appid":400,"assets":{"asset_url_format":"steam/apps/400/${FILENAME}","library_capsule":"library_600x900.jpg"}}
            ]}}"#,
        )
        .unwrap();
        let results = results_for_batch(&[480, 400], body.response.store_items);
        assert_eq!(results[&480], GameArt::default());
        assert!(results[&400]
            .portrait
            .as_deref()
            .unwrap()
            .ends_with("library_600x900.jpg"));
    }

    #[test]
    fn a_missing_portrait_expires_sooner_than_a_found_one() {
        let now = FOUND_TTL_SECS + 1000;
        let entry = |portrait: Option<&str>, age: u64| CachedArt {
            art: GameArt {
                portrait: portrait.map(String::from),
                hero: None,
            },
            fetched_at: now - age,
        };

        assert!(is_fresh(&entry(Some("u"), MISSING_TTL_SECS + 1), now));
        assert!(!is_fresh(&entry(None, MISSING_TTL_SECS + 1), now));
        assert!(!is_fresh(&entry(Some("u"), FOUND_TTL_SECS + 1), now));
    }
}
