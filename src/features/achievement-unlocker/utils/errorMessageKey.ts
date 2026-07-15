import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key,
// covering the codes reachable from the queue/settings/order commands
// (get_achievement_unlocker_queue and friends, get/set_achievement_unlocker_settings,
// get/save_achievement_order). Import-timings has its own mapping below - those errors need
// specific, actionable messages, not this generic fallback. Typed as `Record<string,
// TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  achievement_unlocker_queue_cache_io_failed:
    'dashboard.achievementUnlocker.errors.queueCacheIoFailed',
  achievement_unlocker_settings_io_failed: 'dashboard.achievementUnlocker.errors.settingsIoFailed',
  achievement_order_io_failed: 'dashboard.achievementUnlocker.errors.orderIoFailed',
  steam_not_running: 'common.errors.steamNotRunning',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'common.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY

// import_achievement_timings targets an arbitrary Steam profile unrelated to the signed-in
// account, so its failure modes (private profile, no timestamps, unresolvable input) are
// meaningfully different from the queue/settings/order errors above and get their own, more
// specific copy instead of the generic fallback.
const IMPORT_TIMINGS_ERROR_KEYS: Record<string, TranslationKey> = {
  player_profile_private: 'dashboard.achievementUnlocker.importTimings.errors.profilePrivate',
  player_no_timestamps: 'dashboard.achievementUnlocker.importTimings.errors.noTimestamps',
  player_profile_not_found: 'dashboard.achievementUnlocker.importTimings.errors.notFound',
  steam_api_request_failed: 'dashboard.achievementUnlocker.importTimings.errors.generic',
  steam_api_response_invalid: 'dashboard.achievementUnlocker.importTimings.errors.generic',
  steam_api_key_missing: 'dashboard.achievementUnlocker.importTimings.errors.generic',
}

const IMPORT_TIMINGS_GENERIC_KEY: TranslationKey =
  'dashboard.achievementUnlocker.importTimings.errors.generic'

export const importTimingsErrorMessageKey = (code: string) =>
  IMPORT_TIMINGS_ERROR_KEYS[code] ?? IMPORT_TIMINGS_GENERIC_KEY
