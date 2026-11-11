import type { TranslationKey } from '@/i18n'

// Error codes from CLI mode's local Steam client (Local Sign-in) that every feature talking to it
// can hit - spread into each feature's own errorMessageKey.ts map rather than repeated in each.
//
// `steam_not_running` also comes from Rust's `require_steam_running` pre-flight. The other four
// come from libs/SteamUtility/Backends/SteamworksInit.cs, which splits what used to be one blanket
// `steam_not_running` for any failed Steam init: a signed-out or still-starting Steam, an outdated
// Steam, a game the signed-in account doesn't own, and an owned game Steam wouldn't start (in
// practice a Steam Families lock while the owner plays it). Rust retries the transient ones before
// they get here - see src-tauri/src/steam_utility_exe.rs.
export const LOCAL_STEAM_ERROR_KEYS: Record<string, TranslationKey> = {
  steam_not_running: 'common.errors.steamNotRunning',
  steam_not_ready: 'common.errors.steamNotReady',
  steam_client_outdated: 'common.errors.steamClientOutdated',
  game_not_owned: 'common.errors.gameNotOwned',
  steam_game_unavailable: 'common.errors.steamGameUnavailable',
  // Steam started a session for the game but never answered the stats request within
  // SteamworksSession's 10s wait - the same "Steam was too slow" situation as the daemon's timeout.
  stats_request_timeout: 'common.errors.timeout',
}
