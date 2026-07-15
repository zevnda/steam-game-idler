import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// mirrors src/features/favorites/utils/errorMessageKey.ts, covering the codes reachable from
// get_auto_idle_list/add_to_auto_idle_list/remove_from_auto_idle_list/set_auto_idle_list_order/
// set_auto_idle_enabled/start_auto_idle_games. Typed as `Record<string, TranslationKey>` (see
// src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  auto_idle_cache_io_failed: 'dashboard.autoIdle.errors.cacheIoFailed',
  steam_not_running: 'common.errors.steamNotRunning',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.autoIdle.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
