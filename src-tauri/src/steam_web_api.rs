//! Steam Web API key resolution, shared by every feature that calls a Steam Web API endpoint -
//! today `local_steam::steam_web_api` (persona/avatar lookups for CLI-mode accounts) and
//! `games::web_api` (owned-games playtime enrichment for both sign-in modes). Moved out of
//! `local_steam` (its original, CLI-mode-only home) once `games` needed the exact same fallback
//! behavior instead of a second copy of it.

/// Resolves the Steam Web API key to use: an explicitly provided key wins, otherwise the
/// compile-time-obfuscated build key (see `embedded_api_key`), so no feature that needs the Web
/// API requires the user to have configured their own key.
pub fn resolve_api_key(provided: Option<String>) -> crate::error::AppResult<String> {
    if let Some(key) = provided {
        if !key.trim().is_empty() {
            return Ok(key);
        }
    }

    crate::embedded_api_key::decode().ok_or(crate::error::AppError::MissingApiKey)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::{AppError, AppResult};

    /// Whatever `STEAM_API_KEY` (if any) this test binary was actually compiled with - these
    /// tests assert against the real fallback behavior for *this* build rather than assuming a
    /// key is absent, since dev machines commonly have one set (this repo's own does).
    fn build_time_key() -> Option<String> {
        crate::embedded_api_key::decode()
    }

    #[test]
    fn explicit_key_wins_even_when_a_build_time_key_exists() {
        assert_eq!(
            resolve_api_key(Some("explicit-key".to_string())).unwrap(),
            "explicit-key"
        );
    }

    #[test]
    fn blank_explicit_key_falls_through_to_the_build_time_key() {
        assert_fallback_matches_build_time_key(resolve_api_key(Some("   ".to_string())));
    }

    #[test]
    fn no_key_anywhere_is_a_typed_error_not_a_panic() {
        // Regression coverage for a real bug in `main`'s equivalent
        // (`api_key.unwrap_or_else(|| std::env::var("KEY").unwrap())` - panics, doesn't error, if
        // neither is set). Whether that's actually reachable here depends on this build's
        // STEAM_API_KEY, hence delegating to the shared assertion below rather than hardcoding
        // `MissingApiKey`.
        assert_fallback_matches_build_time_key(resolve_api_key(None));
    }

    fn assert_fallback_matches_build_time_key(result: AppResult<String>) {
        match build_time_key() {
            Some(expected) => assert_eq!(result.unwrap(), expected),
            None => assert!(matches!(result.unwrap_err(), AppError::MissingApiKey)),
        }
    }
}
