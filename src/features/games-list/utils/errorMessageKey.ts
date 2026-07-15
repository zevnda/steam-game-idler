import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key,
// covering the codes reachable from get_owned_games/get_owned_games_cache. Unrecognized codes
// (including SteamUtility-native codes forwarded verbatim through AppError::Agent/AppError::SteamUtility)
// fall back to a generic message that still surfaces the raw code, so an unmapped error is never
// silently swallowed - same convention as the sign-in features' own errorMessageKey.ts.
// `agent_steam_id_unknown` maps to `common.errors.steamIdUnknown` (moved out of this feature's own
// section once favorites became a second real consumer - see favorites' own errorMessageKey.ts).
// `ownership_check_failed` no longer exists (Step 14 removed `AppError::OwnershipCheckFailed` once
// `local_steam::ownership` switched to `steam_utility_exe::run_and_parse`, which forwards
// SteamUtility's real domain code instead of always wrapping failures in one generic code) - CLI-mode
// ownership failures now fall through to the generic message below with the real code attached.
// Typed as `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  steam_api_request_failed: 'dashboard.games.errors.webApiUnavailable',
  steam_api_response_invalid: 'dashboard.games.errors.webApiUnavailable',
  steam_api_key_missing: 'dashboard.games.errors.webApiUnavailable',
  games_cache_io_failed: 'dashboard.games.errors.cacheIoFailed',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.games.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
