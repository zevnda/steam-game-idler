//! CLI-mode ownership check: spawns a one-shot `SteamUtility.exe check_ownership` process (no
//! args - defaults to the curated real-games whitelist, see `GameWhitelistProvider.cs`) and parses
//! its single JSON stdout line (`Core/Json/JsonEnvelope.cs`'s `{ok, result|error}` shape, same as
//! the daemon's IPC responses). Requires a real, running, signed-in local Steam client
//! (Steamworks.NET-backed) - see `Backends/SteamworksLocalBackend.cs`'s `CheckOwnershipAsync`.
//!
//! Playtime enrichment isn't this module's job - see `crate::games::web_api`, the same Steam Web
//! API step agent mode's ownership check also funnels through.

use serde::Deserialize;

use crate::error::AppResult;
use crate::games::RawOwnedGame;
use crate::steam_utility_exe;

#[derive(Debug, Deserialize)]
struct CheckOwnershipResult {
    games: Vec<RawOwnedGame>,
}

pub async fn check_ownership() -> AppResult<Vec<RawOwnedGame>> {
    let result: CheckOwnershipResult =
        steam_utility_exe::run_and_parse(&["check_ownership"]).await?;
    Ok(result.games)
}
