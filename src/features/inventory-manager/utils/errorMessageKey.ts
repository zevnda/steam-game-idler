import type { TranslationKey } from '@/i18n'

// Maps a stable error code (see src-tauri/src/error.rs::AppError::code) to a translation key -
// covers what get_inventory/get_item_price/list_items/update_item_price_data/
// remove_market_listings/get_inventory_settings/set_inventory_settings can throw, plus the usual
// agent/steam-utility/steam-community codes every cookie-authenticated command surface can hit.
// Reuses `common.errors`/`dashboard.cardFarming.errors.sessionFailed` wherever the underlying text
// is identical. Typed as
// `Record<string, TranslationKey>` (see src/i18n/index.ts's `TranslationKey` doc comment).
const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  agent_session_not_found: 'common.errors.sessionNotFound',
  agent_request_timeout: 'common.errors.timeout',
  agent_process_exited: 'common.errors.processExited',
  steam_utility_exe_not_found: 'common.errors.steamUtilityMissing',
  agent_process_spawn_failed: 'common.errors.processSpawnFailed',
  agent_steam_id_unknown: 'common.errors.steamIdUnknown',
  steam_community_session_failed: 'dashboard.cardFarming.errors.sessionFailed',
  // Reuses card-farming's copy (same underlying Rust error, same "reconnect" fix) rather than a
  // duplicate inventory-manager string - see that feature's errorMessageKey.ts for why.
  steam_community_session_expired: 'dashboard.cardFarming.errors.sessionExpired',
  inventory_fetch_failed: 'dashboard.inventoryManager.errors.fetchFailed',
  inventory_cache_io_failed: 'dashboard.inventoryManager.errors.cacheIoFailed',
  market_price_fetch_failed: 'dashboard.inventoryManager.errors.priceFetchFailed',
  market_price_rate_limited: 'dashboard.inventoryManager.errors.priceRateLimited',
  inventory_item_not_found: 'dashboard.inventoryManager.errors.itemNotFound',
  market_listings_fetch_failed: 'dashboard.inventoryManager.errors.listingsFetchFailed',
  inventory_settings_io_failed: 'dashboard.inventoryManager.errors.settingsIoFailed',
}

// A separate typed constant, not an inline literal - an explicit return-type annotation on an
// arrow function is banned project-wide (eslint's no-restricted-syntax), and without either one TS
// widens a bare string-literal fallback to plain `string` here.
const GENERIC_KEY: TranslationKey = 'dashboard.inventoryManager.errors.generic'

export const errorMessageKey = (code: string) => KNOWN_ERROR_KEYS[code] ?? GENERIC_KEY
