import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

export interface SteamCookiesLike {
  sid: string
  sls: string
  sma?: string
}

interface SteamCookiesEntry {
  // Whether `get_steam_credentials` has resolved at least once for this account yet - what lets
  // `useAutoConnectSteamCookies` tell "no saved cookies" apart from "haven't checked yet", so
  // callers (CardFarmingPage/InventoryManagerPage) know when it's actually safe to render a
  // connect panel instead of showing a neutral loading state a little longer.
  isChecked: boolean
  savedCookies: SteamCookiesLike | null
}

const EMPTY_ENTRY: SteamCookiesEntry = { isChecked: false, savedCookies: null }

interface SteamCookiesStore {
  accountKey: AccountKey | null
  entries: Record<AccountKey, SteamCookiesEntry>
  isChecked: boolean
  savedCookies: SteamCookiesLike | null
  setActiveAccount: (key: AccountKey) => void
  updateEntry: (key: AccountKey, patch: Partial<SteamCookiesEntry>) => void
  clearEntry: (key: AccountKey) => void
}

// Holds the OS-credential-store-backed manual Steam Community cookie set
// (`get_steam_credentials`/`set_steam_credentials`) per signed-in account - mirrors
// gamesListStore's/cardFarmingStore's accountKey/entries split. Populated once per account by
// `useSteamCookiesSync` (mounted in `DashboardShell`, starts checking as soon as an account becomes
// active) rather than by each page's own connect-panel hook re-fetching on every mount, which used
// to race a real credentials check against the page's own render and produce a brief, incorrect
// flash of the connect panel even for an account that already had valid cookies.
//
// `SteamCredentialsTab` (Settings modal) and `SteamCookiesConnectPanel`'s own manual-entry form
// both write through `updateEntry` after a successful save/clear/acquire so every consumer sees
// the same value instantly, without needing a page remount elsewhere to notice.
export const useSteamCookiesStore = create<SteamCookiesStore>((set, get) => ({
  accountKey: null,
  entries: {},
  isChecked: false,
  savedCookies: null,
  setActiveAccount: key => {
    const { entries } = get()
    const entry = entries[key] ?? EMPTY_ENTRY
    set({
      accountKey: key,
      entries: entries[key] ? entries : { ...entries, [key]: entry },
      ...entry,
    })
  },
  updateEntry: (key, patch) => {
    const state = get()
    const entry = { ...(state.entries[key] ?? EMPTY_ENTRY), ...patch }
    set({
      entries: { ...state.entries, [key]: entry },
      ...(state.accountKey === key ? entry : {}),
    })
  },
  clearEntry: key => {
    const state = get()
    const entries = { ...state.entries }
    delete entries[key]
    set(state.accountKey === key ? { entries, accountKey: null, ...EMPTY_ENTRY } : { entries })
  },
}))
