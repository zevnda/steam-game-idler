//! CLI-mode sign-in: works against the *local* Steam client installation (via `steamlocate` and
//! `loginusers.vdf`) rather than a network-only SteamKit2 session - see `steam_agent` for that.
//! This is the fallback sign-in method for users who don't want to give the app their Steam
//! username/password: it requires a real local Steam client, and "signing in" here just means
//! picking one of the accounts already known to that client, rather than establishing any session
//! of our own the way `steam_agent::AgentProcess` does.

pub(crate) mod achievements;
pub mod commands;
pub mod free_game_claim;
pub(crate) mod ownership;
mod steam_web_api;
mod vdf;

use std::path::PathBuf;

use steamlocate::SteamDir;

use crate::error::{AppError, AppResult};

fn locate_steam() -> AppResult<SteamDir> {
    SteamDir::locate().map_err(|e| AppError::SteamNotFound(e.to_string()))
}

fn login_users_vdf_path() -> AppResult<PathBuf> {
    Ok(locate_steam()?.path().join("config").join("loginusers.vdf"))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Not run by default (`cargo test -- --ignored` to opt in): exercises `steamlocate` and
    /// `vdf::parse_login_users` against whatever real Steam installation exists on the machine
    /// running the test, rather than a synthetic fixture. Only asserts that a real install parses
    /// without error - it deliberately doesn't assert on account contents, since that would bake a
    /// specific machine's real Steam accounts into the test.
    #[test]
    #[ignore = "depends on a real local Steam installation on the machine running the test"]
    fn locates_and_parses_a_real_steam_install() {
        let path = login_users_vdf_path().expect("Steam should be locatable on this machine");
        let users = vdf::parse_login_users(&path)
            .expect("a real loginusers.vdf should parse without error");
        println!("parsed {} real local Steam account(s)", users.len());
    }
}
