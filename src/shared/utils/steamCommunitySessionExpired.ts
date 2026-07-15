import type { SignedInAccount } from '@/shared/stores/sessionStore'
import { getAccountKey } from '@/shared/stores/sessionStore'
import { useSteamCookiesStore } from '@/shared/stores/steamCookiesStore'

// Shared cleanup for the `steam_community_session_expired` AppError (see its doc comment in
// src-tauri/src/error.rs) - the OS-credential-store side is already cleared by Rust
// (`steam_community::session::ensure_valid`) before this error ever reaches the frontend, but
// `steamCookiesStore`'s own client-side cache of that value doesn't know about it on its own, so a
// reappeared connect panel (CardFarmingStartPanel/InventoryConnectPanel, both via
// SteamCookiesConnectPanel) would otherwise prefill the exact same dead cookies right back into the
// manual tab. Clears just `savedCookies`, not the whole entry via `clearEntry` - `isChecked` must
// stay `true`, or `useAutoConnectSteamCookies`'s `isChecking` flips back on and strands the connect
// panel behind a loading skeleton that nothing re-resolves (nothing re-runs `useSteamCookiesSync`'s
// one-time-per-account check).
export function clearSavedSteamCookies(account: SignedInAccount) {
  const key = getAccountKey(account)
  useSteamCookiesStore.getState().updateEntry(key, { savedCookies: null })
}
