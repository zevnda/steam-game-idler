import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'
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
export function clearSavedSteamCookiesByKey(key: AccountKey) {
  useSteamCookiesStore.getState().updateEntry(key, { savedCookies: null })
}

// Key-based variant's account-object counterpart - kept for call sites (start/connect flows) that
// already have a full `SignedInAccount` in hand rather than a resolved `AccountKey`.
// `useCardFarmingSync`'s mid-cycle `FARMING_STATE_EVENT` listener uses the key-based form directly
// instead, since it only ever resolves a `steamId` to an `AccountKey`, not a full account object -
// see that hook for the case this needs to also cover a backgrounded (not currently mounted)
// account's cycle expiring.
export function clearSavedSteamCookies(account: SignedInAccount) {
  clearSavedSteamCookiesByKey(getAccountKey(account))
}
