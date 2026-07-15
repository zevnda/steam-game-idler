import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// covers both the top-level errors `set_idle_games`/`get_idle_state` can throw (agent mode only -
// see idling::commands) and the per-game codes that can appear in IdleSetResult.failures (CLI mode
// only - see idling::manager::IdlingManager::set_games). Shared with agent-sign-in/games-list
// wherever the underlying text is identical.
// Typed as `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  steam_utility_exe_not_found: 'common.errors.steamUtilityMissing',
  agent_process_spawn_failed: 'common.errors.processSpawnFailed',
  idle_process_start_failed: 'dashboard.idling.errors.startFailed',
  steam_not_running: 'common.errors.steamNotRunning',
  max_playtime_cap_reached: 'dashboard.idling.errors.maxPlaytimeCapReached',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.idling.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
