import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// covers what `get_games_with_drops`/`start_farming`/`stop_farming`/`get_farming_state` can throw
// (session acquisition/scrape failures, plus the usual agent/steam-utility errors every command
// surface can hit). Reuses `common.errors` wherever the underlying text is identical. Typed as
// `Record<string, TranslationKey>` (see
// src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  steam_utility_exe_not_found: 'common.errors.steamUtilityMissing',
  agent_process_spawn_failed: 'common.errors.processSpawnFailed',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  steam_not_running: 'common.errors.steamNotRunning',
  // Renamed from `card_farming_session_failed` when the underlying logic moved into the shared
  // `steam_community` module (inventory-manager surfaces this same code too).
  steam_community_session_failed: 'dashboard.cardFarming.errors.sessionFailed',
  // A definitive, unrecoverable expiry (Rust already cleared any saved credentials before
  // throwing this) - distinct copy from `sessionFailed` since the fix here is "reconnect", not
  // "check your cookies" (see AppError::SteamCommunitySessionExpired's doc comment).
  steam_community_session_expired: 'dashboard.cardFarming.errors.sessionExpired',
  card_farming_scrape_failed: 'dashboard.cardFarming.errors.scrapeFailed',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.cardFarming.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY

// CardFarmingStartPanel's own mapper for its errorSlot - overrides `sessionExpired` back to
// `sessionFailed`'s "check your cookies" copy, since every code this panel ever sees comes from a
// fresh, not-yet-proven candidate (a first-time manual paste, or an auto-connect retry of a
// previously-saved set that's about to get cleared either way). Steam's validation response can't
// actually distinguish "these cookies were never valid" from "these were valid and got revoked" -
// see `steam_community::session::validate`'s doc comment - so `sessionExpired`'s "your session
// expired, please reconnect" wording is misleading here regardless of which of the two ambiguous
// Rust-side outcomes produced it. Mirrors `settings::steamCredentialsErrorMessageKey`'s identical
// override, made for the exact same reason. `errorMessageKey` above is unchanged and still used for
// CardFarmingPage's page-level banner, where a `sessionExpired` really does mean an
// already-connected, already-working session just broke (e.g. mid-farm - see `useCardFarming`'s
// `state.sessionExpired` effect).
export const connectErrorMessageKey = (code: string) =>
  code === 'steam_community_session_expired'
    ? KNOWN_ERROR_KEYS.steam_community_session_failed
    : errorMessageKey(code)
