import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code, plus the
// SteamUtility-native codes forwarded verbatim through AppError::Agent - see AuthFlow.cs) to a
// translation key. Unrecognized codes fall back to a generic message that still surfaces the raw
// code, so an unmapped SteamUtility error is never silently swallowed. Typed as `Record<string,
// TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  steam_utility_exe_not_found: 'common.errors.steamUtilityMissing',
  agent_process_spawn_failed: 'common.errors.processSpawnFailed',
  agent_process_exited: 'common.errors.processExited',
  agent_request_timeout: 'common.errors.timeout',
}

// `AuthFlow.LoginWithCredentialsAsync` reports a failed logon as `logon_failed:{EResult}` -
// `InvalidPassword` covers both a wrong password and a wrong/unrecognized username (Steam doesn't
// distinguish the two to avoid leaking account existence).
const isInvalidCredentials = (code: string) =>
  code === 'logon_failed:InvalidPassword' || code === 'logon_failed:AccountLogonDenied'

// Both `LoginWithQrAsync` (QR scan) and `LoginWithCredentialsAsync` (device/email 2FA
// confirmation) resolve through the same `AuthSession.PollingWaitForResultAsync` - when the user
// taps "Deny" in the Steam Mobile app for either one, SteamKit2 surfaces it as an
// `AuthenticationException` with `EResult.FileNotFound` (a real Steam CM quirk, not a mismapped
// SteamKit2 detail - confirmed against real logs, see `useAgentQrSignIn.ts`'s
// `isRecoverableQrTimeout` for the sibling `Expired`/timeout case this is distinct from). This
// must never be auto-retried like a timeout is - the user made an explicit choice.
const isDenied = (code: string) => /with result FileNotFound\.$/.test(code)

// Separate typed constants, not inline literals - an explicit return-type annotation on an arrow
// function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal return/fallback to plain `string` here.
const INVALID_CREDENTIALS_KEY: TranslationKey = 'auth.signIn.errors.invalidCredentials'
const DENIED_KEY: TranslationKey = 'auth.signIn.errors.denied'
const GENERIC_KEY: TranslationKey = 'auth.signIn.errors.generic'

export const errorMessageKey = (code: string) => {
  if (isInvalidCredentials(code)) {
    return INVALID_CREDENTIALS_KEY
  }
  if (isDenied(code)) {
    return DENIED_KEY
  }
  return KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
}
