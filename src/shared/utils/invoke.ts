import type { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import { logFrontendError } from './frontendLogging'

// Stable `AppError` codes (see src-tauri/src/error.rs's `AppError::code()`) that represent an
// expected/user-caused outcome - a private profile, a not-yet-set API key, a rate limit already
// handled with backoff - rather than an app bug. Every call site already surfaces these via a
// toast or inline UI state, so logging them too would just bury the failures that actually need
// investigating when a user reports a bug. Anything NOT in this set reaching a `catch` block below
// is unexpected (an IO/network/parse/process failure) and gets written to the log file.
const EXPECTED_ERROR_CODES = new Set([
  'agent_no_saved_credentials',
  'agent_session_not_found',
  'player_profile_private',
  'player_no_timestamps',
  'player_profile_not_found',
  'market_price_rate_limited',
  'inventory_item_not_found',
  'steam_api_key_missing',
  'custom_background_invalid',
  // Expired-credentials outcome - Rust already logs the lifecycle event itself (session.rs's
  // `ensure_valid`) when it clears the saved cookies, so logging it again here as an unexpected
  // frontend failure would just duplicate that line.
  'steam_community_session_expired',
  // CLI-mode pre-flight rejection (`require_steam_running`) - Rust already logs the warn itself,
  // and every call site surfaces this via a toast, so it's an expected/user-caused outcome too.
  'steam_not_running',
])

// Thin wrapper around `@tauri-apps/api/core`'s `invoke` that logs unexpected command failures to
// the backend's log file before rethrowing - a drop-in replacement (same name/signature) so every
// existing call site and its own try/catch/toast handling keeps working unchanged. Centralized here
// rather than added to each of the ~50 hooks that call `invoke` individually.
export async function invoke<T>(cmd: string, args?: InvokeArgs, options?: InvokeOptions) {
  try {
    return await tauriInvoke<T>(cmd, args, options)
  } catch (error) {
    if (!EXPECTED_ERROR_CODES.has(String(error))) {
      logFrontendError('invoke', `${cmd} failed`, { error: String(error) })
    }
    throw error
  }
}
