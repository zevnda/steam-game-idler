//! OS-backed secret storage for agent-mode (SteamKit2) refresh tokens.
//!
//! A saved refresh token is a bearer credential - anyone holding it can log in as that Steam
//! account without ever knowing the password or a Steam Guard code, until it's revoked. It is
//! deliberately *not* stored in `settings.json`: that file lives as plain JSON in the app data
//! directory, and base64 (the wire encoding SteamUtility already uses for it) provides zero
//! confidentiality. Instead it goes through the `keyring` crate into the OS credential store - the
//! Windows Credential Manager on Windows, so the ciphertext is tied to the local Windows user
//! account - copying `settings.json` (or the whole app-data folder, e.g. via a cloud backup) to
//! another machine or user yields nothing usable.
//!
//! **On Linux the store is the freedesktop Secret Service over D-Bus** (GNOME Keyring, KWallet,
//! ...), which `keyring`'s `v1` feature selects there automatically. A working keyring is a
//! documented user-side requirement on Linux (`docs/.../get-started/install.mdx`, and the
//! `#linux-keyring-secret-service` troubleshooting entry for setups without one - SteamOS/Bazzite
//! Game Mode, minimal window managers, auto-login sessions with a locked keyring). Nothing here
//! tries to work around a missing keyring; two things only make sure one fails cleanly:
//! - A read of a secret with a working fallback (today only the Steam Web API key override, which
//!   falls through to the embedded build key) degrades to "nothing saved" instead of failing - see
//!   [`load_web_api_key`]. `get_settings` reads that key, and nearly every app-wide frontend hook
//!   (theme, font, close-to-tray, ...) hydrates from `get_settings`, so a hard error there broke
//!   far more than the one API-key field. A missing keyring now only affects what genuinely needs
//!   it (persisting the agent-mode sign-in).
//! - Every failure is logged with the underlying `keyring` error (see [`store_error`]), so a user's
//!   log file says the keyring is the problem rather than only the frontend's opaque
//!   `agent_credential_store_error` code. Note `keyring::v1` initializes the platform store at most
//!   once per process - its "initialized" flag flips *before* the attempt - so after a failed first
//!   Secret Service connection, every later call fails fast with `NoDefaultStore` until the app
//!   restarts, and only that first logged failure carries the real cause.

use std::sync::atomic::{AtomicBool, Ordering};
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

/// Runs `f` against the `(service, key)` entry with `CREDENTIAL_LOCK` held for the whole call -
/// including opening the entry, since the very first `Entry::new` in a process is also what
/// initializes the platform store (see the module doc).
fn with_entry<T>(
    service: &str,
    key: &str,
    f: impl FnOnce(&Entry) -> keyring::Result<T>,
) -> keyring::Result<T> {
    let _guard = CREDENTIAL_LOCK.lock().unwrap();
    f(&Entry::new(service, key)?)
}

/// Treats "nothing was ever saved under this entry" as `Ok(None)` - the expected state for most
/// entries on most installs, never an error.
fn missing_as_none<T>(result: keyring::Result<T>) -> keyring::Result<Option<T>> {
    match result {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e),
    }
}

/// Logs the underlying `keyring` error before collapsing it into `AppError::CredentialStore` - the
/// frontend only ever receives the stable `agent_credential_store_error` code (see `AppError`'s
/// `Serialize` impl), so without this the actual cause never reaches the user's log file.
fn store_error(operation: &'static str, e: keyring::Error) -> AppError {
    tracing::warn!(operation, error = %e, "OS credential store call failed");
    AppError::CredentialStore(e.to_string())
}

/// Saves (or overwrites) the refresh token for `key` - an already-normalized (trimmed/lowercased)
/// account key, matching `AgentManager`'s session map key.
pub fn save_refresh_token(key: &str, token_b64: &str) -> AppResult<()> {
    with_entry(SERVICE_NAME, key, |entry| entry.set_password(token_b64))
        .map_err(|e| store_error("save_refresh_token", e))
}

/// Returns `Ok(None)` if no token was ever saved for `key`, rather than an error - that's the
/// expected state for any account that's never completed a credential login on this machine.
pub fn load_refresh_token(key: &str) -> AppResult<Option<String>> {
    with_entry(SERVICE_NAME, key, |entry| {
        missing_as_none(entry.get_password())
    })
    .map_err(|e| store_error("load_refresh_token", e))
}

/// Namespaces manually-saved Steam Community session cookies separately from agent-mode refresh
/// tokens above - unrelated credential kinds that happen to share the same OS-keyring mechanism
/// (see `steam_community::credentials`'s doc comment for why `steamLoginSecure` gets the same
/// treatment as a refresh token rather than living in plain JSON).
const COMMUNITY_SERVICE_NAME: &str = "com.zevnda.steam-game-idler.steam-community";

/// Saves (or overwrites) the given already-serialized cookie JSON for `steam_id`.
pub fn save_steam_community_cookies(steam_id: &str, cookies_json: &str) -> AppResult<()> {
    with_entry(COMMUNITY_SERVICE_NAME, steam_id, |entry| {
        entry.set_password(cookies_json)
    })
    .map_err(|e| store_error("save_steam_community_cookies", e))
}

/// Returns `Ok(None)` if no cookies were ever saved for `steam_id`, rather than an error - the
/// expected state for any account that's never used the manual-cookies settings tab.
pub fn load_steam_community_cookies(steam_id: &str) -> AppResult<Option<String>> {
    with_entry(COMMUNITY_SERVICE_NAME, steam_id, |entry| {
        missing_as_none(entry.get_password())
    })
    .map_err(|e| store_error("load_steam_community_cookies", e))
}

/// A no-op (not an error) if nothing was ever saved for `steam_id`.
pub fn delete_steam_community_cookies(steam_id: &str) -> AppResult<()> {
    with_entry(COMMUNITY_SERVICE_NAME, steam_id, |entry| {
        missing_as_none(entry.delete_credential())
    })
    .map(|_| ())
    .map_err(|e| store_error("delete_steam_community_cookies", e))
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
    with_entry(WEB_API_KEY_SERVICE_NAME, WEB_API_KEY_ENTRY, |entry| {
        entry.set_password(key)
    })
    .map_err(|e| store_error("save_web_api_key", e))
}

/// Set once [`load_web_api_key`] has logged a store failure at `warn` - see its doc comment.
static WEB_API_KEY_READ_FAILURE_LOGGED: AtomicBool = AtomicBool::new(false);

/// Returns the user's Steam Web API key override, or `None` if they've never set one - the
/// expected state for most installs, which fall through to the embedded build key (see
/// `steam_web_api::resolve_api_key`).
///
/// Deliberately infallible: a store that can't be read at all (no Secret Service on SteamOS - see
/// the module doc) is also treated as `None`, since every caller has that same embedded-key
/// fallback and none of them should fail outright over an optional override. The failure is
/// logged at `warn` once per process and at `debug` after that - `get_settings` calls this from
/// roughly ten frontend hooks at startup and again on every settings toggle, so an unreachable
/// store would otherwise bury the rest of the log in identical lines.
pub fn load_web_api_key() -> Option<String> {
    let result = with_entry(WEB_API_KEY_SERVICE_NAME, WEB_API_KEY_ENTRY, |entry| {
        missing_as_none(entry.get_password())
    });
    match result {
        Ok(key) => key,
        Err(e) => {
            if WEB_API_KEY_READ_FAILURE_LOGGED.swap(true, Ordering::Relaxed) {
                tracing::debug!(error = %e, "couldn't read the Steam Web API key override");
            } else {
                tracing::warn!(
                    error = %e,
                    "couldn't read the Steam Web API key override from the OS credential store, \
                     falling back to the embedded key"
                );
            }
            None
        }
    }
}

/// A no-op (not an error) if no key override was ever saved.
pub fn delete_web_api_key() -> AppResult<()> {
    with_entry(WEB_API_KEY_SERVICE_NAME, WEB_API_KEY_ENTRY, |entry| {
        missing_as_none(entry.delete_credential())
    })
    .map(|_| ())
    .map_err(|e| store_error("delete_web_api_key", e))
}
