import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// covers the codes reachable from get_free_games/claim_free_game. A `FreeGameClaimOutcome::Failed`
// result isn't handled here - that's not a thrown AppError, it's a successful call reporting a
// claim-level failure (see FreeGameCard, which shows one fixed generic message with the reason
// interpolated only as debug detail, same as this file's own `generic` fallback does for codes).
// Typed as `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  steam_utility_exe_not_found: 'common.errors.steamUtilityMissing',
  agent_process_spawn_failed: 'common.errors.processSpawnFailed',
  free_games_scrape_failed: 'dashboard.freeGames.errors.scrapeFailed',
  store_login_failed: 'dashboard.freeGames.errors.storeLoginFailed',
  store_logout_failed: 'dashboard.freeGames.errors.storeLogoutFailed',
  store_claim_failed: 'dashboard.freeGames.errors.claimFailed',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.freeGames.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
