import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key,
// covering the codes reachable from get_favorites/add_favorite/remove_favorite/
// set_favorites_order. `agent_steam_id_unknown` is reused from `common.errors` rather than a
// favorites-local key - games-list already needed it (see its own errorMessageKey.ts), and
// favorites resolving steam_id via the same `resolve_steam_id` helper is a second real consumer,
// the same "reuse an existing key" threshold that moved idling's strings into `common.errors`.
// Typed as `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  favorites_cache_io_failed: 'dashboard.favorites.errors.cacheIoFailed',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.favorites.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
