import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// covers the codes reachable from get_settings/set_steam_web_api_key. Typed as
// `Record<string, TranslationKey>` (not `string`) so a typo'd/removed key here is a compile error -
// see src/i18n/index.ts's `TranslationKey` doc comment for why this matters for a dynamically
// computed key. Each `*_GENERIC_KEY` below is a separate typed constant, not an inline literal,
// because an explicit return-type annotation on an arrow function is banned project-wide (eslint's
// no-restricted-syntax) - without either one, TS's return-type inference would widen a bare
// string-literal fallback to plain `string`.
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  settings_io_failed: 'dashboard.settings.errors.ioFailed',
  // Synthetic code (not an `AppError` variant) - `saveSteamWebApiKey` sets this itself when
  // `validate_steam_web_api_key` returns `false`, rather than a Rust-side error.
  steam_web_api_key_invalid: 'dashboard.settings.errors.apiKeyInvalid',
  agent_credential_store_error: 'dashboard.settings.errors.credentialStoreFailed',
}
const GENERIC_KEY: TranslationKey = 'dashboard.settings.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY

// Covers the codes reachable from the Debug tab's own commands (log_io_failed from
// get_log_file_path/get_log_lines/clear_log_file) - kept separate from `errorMessageKey` above so
// a log failure doesn't get mapped to the general-tab's settings-file copy.
const DEBUG_ERROR_KEYS: Record<string, TranslationKey> = {
  log_io_failed: 'dashboard.settings.debug.errors.logIoFailed',
}
const DEBUG_GENERIC_KEY: TranslationKey = 'common.errors.generic'

export const debugErrorMessageKey = (code: string) => DEBUG_ERROR_KEYS[code] ?? DEBUG_GENERIC_KEY

// Covers the codes reachable from the Steam Credentials tab's own commands (get/set/
// clear_steam_credentials, validate_and_save_steam_credentials, acquire_and_save_steam_credentials)
// - kept separate for the same reason as DEBUG_ERROR_KEYS above. Both session codes reuse
// card-farming's `sessionFailed` copy ("check your cookies and try again") rather than a bespoke
// one - `validate_and_save_steam_credentials` only ever runs against a fresh, not-yet-saved paste,
// so even a definitive `steam_community_session_expired` reads here as "this one's wrong," not
// "the one you already had stopped working" (contrast CardFarmingPage/InventoryManagerPage's own
// mapping of the same code, which genuinely is a stopped-working case for an already-saved set).
const STEAM_CREDENTIALS_ERROR_KEYS: Record<string, TranslationKey> = {
  steam_credentials_store_io_failed: 'dashboard.settings.steamCredentials.errors.storeIoFailed',
  steam_community_session_failed: 'dashboard.cardFarming.errors.sessionFailed',
  steam_community_session_expired: 'dashboard.cardFarming.errors.sessionFailed',
}
const STEAM_CREDENTIALS_GENERIC_KEY: TranslationKey =
  'dashboard.settings.steamCredentials.errors.generic'

export const steamCredentialsErrorMessageKey = (code: string) =>
  STEAM_CREDENTIALS_ERROR_KEYS[code] ?? STEAM_CREDENTIALS_GENERIC_KEY

// Covers the codes reachable from the Game Settings tab's own commands (idling_settings_io_failed,
// card_farming_settings_io_failed, achievement_unlocker_settings_io_failed) - kept separate for the
// same reason as the other per-tab mappers above. None of the three codes get a more specific
// message than the generic one; listed as no-op entries anyway so a future more-specific message is
// a one-line change, not a new map to introduce.
const GAME_SETTINGS_ERROR_KEYS: Record<string, TranslationKey> = {}
const GAME_SETTINGS_GENERIC_KEY: TranslationKey = 'dashboard.settings.gameSettings.errors.generic'

export const gameSettingsErrorMessageKey = (code: string) =>
  GAME_SETTINGS_ERROR_KEYS[code] ?? GAME_SETTINGS_GENERIC_KEY

// Covers the codes reachable from the Free Games tab's own commands (get/set_free_games_settings,
// ensure/clear_free_games_store_session) - kept separate for the same reason as the other per-tab
// mappers above.
const FREE_GAMES_ERROR_KEYS: Record<string, TranslationKey> = {
  free_games_settings_io_failed: 'dashboard.settings.freeGames.errors.ioFailed',
  store_login_failed: 'dashboard.freeGames.errors.storeLoginFailed',
  store_logout_failed: 'dashboard.freeGames.errors.storeLogoutFailed',
}
const FREE_GAMES_GENERIC_KEY: TranslationKey = 'dashboard.settings.freeGames.errors.generic'

export const freeGamesErrorMessageKey = (code: string) =>
  FREE_GAMES_ERROR_KEYS[code] ?? FREE_GAMES_GENERIC_KEY

// Covers the codes reachable from the Customization tab's own commands (set_theme,
// set_disable_tooltips, set_show_*_carousel, set/clear_custom_background) - kept separate for the
// same reason as the other per-tab mappers above. `custom_background_io_failed`/`settings_io_failed`
// reuse the general ioFailed message rather than a bespoke one - only an invalid picked image needs
// a more specific explanation than "couldn't read or write your settings file."
const CUSTOMIZATION_ERROR_KEYS: Record<string, TranslationKey> = {
  custom_background_invalid: 'dashboard.settings.customization.errors.backgroundInvalid',
  custom_background_io_failed: 'dashboard.settings.errors.ioFailed',
  settings_io_failed: 'dashboard.settings.errors.ioFailed',
}
const CUSTOMIZATION_GENERIC_KEY: TranslationKey = 'dashboard.settings.customization.errors.generic'

export const customizationErrorMessageKey = (code: string) =>
  CUSTOMIZATION_ERROR_KEYS[code] ?? CUSTOMIZATION_GENERIC_KEY
