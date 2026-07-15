//! OS-backed secret storage for agent-mode (SteamKit2) refresh tokens.
//!
//! A saved refresh token is a bearer credential - anyone holding it can log in as that Steam
//! account without ever knowing the password or a Steam Guard code, until it's revoked. It is
//! deliberately *not* stored in `settings.json`: that file lives as plain JSON in the app data
//! directory, and base64 (the wire encoding SteamUtility already uses for it) provides zero
//! confidentiality. Instead it goes through the `keyring` crate into the Windows Credential
//! Manager, so the ciphertext is tied to the local Windows user account - copying `settings.json`
//! (or the whole app-data folder, e.g. via a cloud backup) to another machine or user yields
//! nothing usable.

use std::sync::Mutex;

use keyring::Entry;

use crate::error::{AppError, AppResult};

/// Serializes every OS credential-store call in this module. `get_settings` (reads the web API
/// key) and `agent_login_with_token` (reads a refresh token) both run their credential-store read
/// from the same `_app.tsx` mount, landing on Windows Credential Manager within milliseconds of
/// each other at process startup - observed to spuriously fail one of the two near-simultaneous
/// `CredReadW` calls with a real (non-`NoEntry`) keyring error, even though the saved credential
/// itself is intact (confirmed by the same read succeeding moments later). A process-wide lock
/// removes the collision entirely; each call is a fast OS round trip, so serializing them is free.
static CREDENTIAL_LOCK: Mutex<()> = Mutex::new(());

/// Namespaces this app's entries in the OS credential store so they can't collide with any other
/// app's saved secrets for the same Windows user.
const SERVICE_NAME: &str = "com.zevnda.steam-game-idler.agent";

/// Saves (or overwrites) the refresh token for `key` - an already-normalized (trimmed/lowercased)
/// account key, matching `AgentManager`'s session map key.
pub fn save_refresh_token(key: &str, token_b64: &str) -> AppResult<()> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(SERVICE_NAME, key)?;
    entry
        .set_password(token_b64)
        .map_err(|e| AppError::CredentialStore(e.to_string()))
}

/// Returns `Ok(None)` if no token was ever saved for `key`, rather than an error - that's the
/// expected state for any account that's never completed a credential login on this machine.
pub fn load_refresh_token(key: &str) -> AppResult<Option<String>> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(SERVICE_NAME, key)?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::CredentialStore(e.to_string())),
    }
}

/// Namespaces manually-saved Steam Community session cookies separately from agent-mode refresh
/// tokens above - unrelated credential kinds that happen to share the same OS-keyring mechanism
/// (see `steam_community::credentials`'s doc comment for why `steamLoginSecure` gets the same
/// treatment as a refresh token rather than living in plain JSON).
const COMMUNITY_SERVICE_NAME: &str = "com.zevnda.steam-game-idler.steam-community";

/// Saves (or overwrites) the given already-serialized cookie JSON for `steam_id`.
pub fn save_steam_community_cookies(steam_id: &str, cookies_json: &str) -> AppResult<()> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(COMMUNITY_SERVICE_NAME, steam_id)?;
    entry
        .set_password(cookies_json)
        .map_err(|e| AppError::CredentialStore(e.to_string()))
}

/// Returns `Ok(None)` if no cookies were ever saved for `steam_id`, rather than an error - the
/// expected state for any account that's never used the manual-cookies settings tab.
pub fn load_steam_community_cookies(steam_id: &str) -> AppResult<Option<String>> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(COMMUNITY_SERVICE_NAME, steam_id)?;
    match entry.get_password() {
        Ok(json) => Ok(Some(json)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::CredentialStore(e.to_string())),
    }
}

/// A no-op (not an error) if nothing was ever saved for `steam_id`.
pub fn delete_steam_community_cookies(steam_id: &str) -> AppResult<()> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(COMMUNITY_SERVICE_NAME, steam_id)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::CredentialStore(e.to_string())),
    }
}

fn entry_for(service_name: &str, key: &str) -> AppResult<Entry> {
    Entry::new(service_name, key).map_err(|e| AppError::CredentialStore(e.to_string()))
}

/// Namespaces the user-supplied Steam Web API key override - unrelated to the two credential
/// kinds above, but stored the same OS-keyring way rather than in `settings.json`. The key is a
/// bearer credential for the account's own Steam Web API rate limit (same reasoning as the
/// refresh token above), so it doesn't belong in a plaintext-adjacent JSON file either. Single
/// fixed entry (not steam-id- or account-keyed) since the API key override is app-wide, not
/// per-account.
const WEB_API_KEY_SERVICE_NAME: &str = "com.zevnda.steam-game-idler.settings";
const WEB_API_KEY_ENTRY: &str = "steam-web-api-key";

/// Saves (or overwrites) the user's Steam Web API key override.
pub fn save_web_api_key(key: &str) -> AppResult<()> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(WEB_API_KEY_SERVICE_NAME, WEB_API_KEY_ENTRY)?;
    entry
        .set_password(key)
        .map_err(|e| AppError::CredentialStore(e.to_string()))
}

/// Returns `Ok(None)` if the user has never set a key override - the expected state for most
/// installs, which fall through to the embedded build key (see `steam_web_api::resolve_api_key`).
pub fn load_web_api_key() -> AppResult<Option<String>> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(WEB_API_KEY_SERVICE_NAME, WEB_API_KEY_ENTRY)?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::CredentialStore(e.to_string())),
    }
}

/// A no-op (not an error) if no key override was ever saved.
pub fn delete_web_api_key() -> AppResult<()> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    let entry = entry_for(WEB_API_KEY_SERVICE_NAME, WEB_API_KEY_ENTRY)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::CredentialStore(e.to_string())),
    }
}
