import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key,
// covering the codes actually reachable from this feature's six commands (get_users,
// get_user_summary(_cache), delete_user_summary_file, is_steam_running, launch_steam,
// prepare_steam_account_switch, switch_steam_account). Unrecognized codes fall back to a generic
// message that still surfaces the raw code, so an unmapped error is never silently swallowed.
// Typed as `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  steam_not_found: 'auth.localSignIn.errors.steamNotFound',
  login_vdf_io_failed: 'auth.localSignIn.errors.loginVdfUnreadable',
  login_vdf_parse_failed: 'auth.localSignIn.errors.loginVdfUnreadable',
  steam_id_not_found: 'auth.localSignIn.errors.accountNotFound',
  registry_update_failed: 'auth.localSignIn.errors.switchFailed',
  local_process_spawn_failed: 'auth.localSignIn.errors.launchFailed',
  steam_api_key_missing: 'auth.localSignIn.errors.summaryUnavailable',
  steam_api_request_failed: 'auth.localSignIn.errors.summaryUnavailable',
  steam_api_response_invalid: 'auth.localSignIn.errors.summaryUnavailable',
  user_summary_cache_io_failed: 'auth.localSignIn.errors.summaryUnavailable',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'common.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
