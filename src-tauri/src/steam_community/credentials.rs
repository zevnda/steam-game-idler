//! Persisted manual Steam Community cookies - one shared store behind three surfaces: the Settings
//! modal's Steam Credentials tab, and `CardFarmingStartPanel`/`InventoryConnectPanel`'s own manual-
//! entry tab (via the frontend's `useSavedSteamCookies` hook, see `session.rs`'s doc comment for
//! the acquisition side). A set saved from any one of the three prefills/updates the other two, so
//! the user doesn't have to re-paste `sid`/`sls`/`sma` per feature. `commands.rs`'s
//! `acquire_and_save_steam_credentials` is the automatic-acquisition path that also writes here.
//!
//! **CLI-mode only** - agent mode derives cookies straight from its live daemon session
//! (`session::derive_from_agent_session`) and never needs a manually-saved fallback.
//!
//! **Stored in the OS credential store, not settings.json** - `steamLoginSecure` is a bearer
//! session cookie for the account (anyone holding it can act as the signed-in user on
//! steamcommunity.com), the same sensitivity class as an agent-mode refresh token, so it gets the
//! same treatment `credential_store.rs`'s own doc comment already lays out rather than living in
//! plain JSON. Consequently these cookies are also treated like `agent_accounts`, not like a
//! settings-file preference - `debug::commands::reset_settings` restores preferences back to
//! defaults but deliberately never signs an account out, and this store is left equally untouched
//! by it; the only way to remove a saved set is this module's own [`clear`].

use crate::credential_store;
use crate::error::{AppError, AppResult};

use super::SteamCookies;

pub fn get(steam_id: &str) -> AppResult<Option<SteamCookies>> {
    match credential_store::load_steam_community_cookies(steam_id)? {
        Some(json) => serde_json::from_str(&json)
            .map(Some)
            .map_err(|e| AppError::SteamCredentialsStoreIo(e.to_string())),
        None => Ok(None),
    }
}

pub fn set(steam_id: &str, cookies: &SteamCookies) -> AppResult<()> {
    let json = serde_json::to_string(cookies)
        .map_err(|e| AppError::SteamCredentialsStoreIo(e.to_string()))?;
    credential_store::save_steam_community_cookies(steam_id, &json)
}

pub fn clear(steam_id: &str) -> AppResult<()> {
    credential_store::delete_steam_community_cookies(steam_id)
}
