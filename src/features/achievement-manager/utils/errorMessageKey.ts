import type { TranslationKey } from '@/i18n'
import type { CurrentOs } from '@/shared/stores/platformStore'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// covers the codes reachable from get_achievement_data/set_achievement/unlock_all_achievements/
// lock_all_achievements/update_stats/reset_all_stats. The SteamUtility-native domain codes
// (steam_not_running, invalid_app_id, achievement_not_found, achievement_protected, stat_not_found,
// stat_protected, unsupported_game_coordinator) are forwarded verbatim through AppError::SteamUtility
// (CLI mode) or AppError::Agent (agent mode, where applicable) - see
// libs/SteamUtility/Core/Errors/SteamUtilityExceptions.cs for where they originate. Typed as
// `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  steam_not_running: 'common.errors.steamNotRunning',
  invalid_app_id: 'dashboard.achievements.errors.invalidApp',
  achievement_not_found: 'dashboard.achievements.errors.achievementNotFound',
  achievement_protected: 'dashboard.achievements.errors.protected',
  stat_not_found: 'dashboard.achievements.errors.statNotFound',
  stat_protected: 'dashboard.achievements.errors.protected',
  // Daemon-only restriction (Game Coordinator titles). CLI mode never returns this code. Windows'
  // copy tells the user to fall back to CLI mode - Linux has no such fallback, so it gets its own
  // key instead (see `errorMessageKey`'s `currentOs` param below).
  unsupported_game_coordinator: 'dashboard.achievements.errors.unsupportedGameCoordinator',
}

const UNSUPPORTED_GAME_COORDINATOR_LINUX_KEY: TranslationKey =
  'dashboard.achievements.errors.unsupportedGameCoordinatorLinux'

// A separate typed constant, not an inline literal, because an explicit return-type annotation on
// an arrow function is banned project-wide (see eslint's no-restricted-syntax) - without either one,
// TS's return-type inference widens a bare string-literal fallback to plain `string`, which then no
// longer satisfies `TranslationKey` at every `t(errorMessageKey(...), ...)` call site.
const GENERIC_KEY: TranslationKey = 'dashboard.achievements.errors.generic'

// `currentOs` is optional (undefined at any call site that hasn't been updated to pass it) and
// only ever changes the `unsupported_game_coordinator` case - every other code's message is
// identical on both OSes. See platformStore's own doc comment for why `null`/undefined reads as
// "not Linux" here too.
export const errorMessageKey = (code: string, currentOs?: CurrentOs | null) => {
  if (code === 'unsupported_game_coordinator' && currentOs === 'linux') {
    return UNSUPPORTED_GAME_COORDINATOR_LINUX_KEY
  }
  return KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
}
