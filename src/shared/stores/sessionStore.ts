import { create } from 'zustand'

// Mirrors `games::commands::GamesAccount` in src-tauri/src/games/commands.rs (serde `tag = "mode"`,
// `rename_all_fields = "camelCase"`) - shaped so it can be passed directly as a command's `account`
// argument, not just used internally by games-list. Populated by each sign-in flow's success path
// (useAgentSignIn/useLocalSignIn), read by anything under /dashboard that needs to know which
// account to query.
export type SignedInAccount =
  { mode: 'agent'; username: string } | { mode: 'local'; steamId: string }

export type AccountKey = string

// Stable identity for an account regardless of sign-in mode - `agent:<username>` mirrors
// `AgentManager::key_for`'s normalized key (see useAgentSignIn's `normalizeUsername`), `local:
// <steamId>` needs no normalization since SteamID64s are already canonical. This is the key the
// account switcher lists/selects by, and the key other stores
// (gamesListStore, idlingStore, favoritesStore, etc.) will re-key themselves by once they're
// individually tackled.
export function getAccountKey(account: SignedInAccount) {
  return account.mode === 'agent' ? `agent:${account.username}` : `local:${account.steamId}`
}

const STORAGE_KEY = 'sgi.session.accounts'
const LEGACY_STORAGE_KEY = 'sgi.session.account'

interface PersistedSession {
  accounts: Record<AccountKey, SignedInAccount>
  activeKey: AccountKey | null
}

// This is only ever a *candidate* for resuming a session, never trusted outright - see
// `useSessionBootstrap`, which is the only place this gets read back and turned into a live
// `sessionStore.account` again, and only after re-validating it against the real backend state
// (a saved agent refresh token that still logs on, or a steamId `get_users()` still reports).
// Deliberately not zustand's `persist` middleware: that would rehydrate state synchronously on
// load, before any validation has run, which is exactly the blind-trust behavior `main`'s
// `useInit`/`userSummary` localStorage blob has and that this rewrite is deliberately not porting.
function readPersistedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedSession>
      return { accounts: parsed.accounts ?? {}, activeKey: parsed.activeKey ?? null }
    }

    // Migrate the pre-multi-account shape (`sgi.session.account`, a bare `SignedInAccount`) - still
    // present on any machine that signed in before this step shipped.
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw) {
      const legacyAccount = JSON.parse(legacyRaw) as SignedInAccount
      const key = getAccountKey(legacyAccount)
      const migrated: PersistedSession = { accounts: { [key]: legacyAccount }, activeKey: key }
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      writePersistedSession(migrated)
      return migrated
    }
  } catch (error) {
    console.error('Error reading persisted session:', error)
  }
  return { accounts: {}, activeKey: null }
}

function writePersistedSession(session: PersistedSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Error persisting session:', error)
  }
}

// Every persisted account, for `useSessionBootstrap` to independently re-validate and resume on
// startup - not just the one that was active when the app closed. Resuming only `activeKey` (this
// function's pre-switcher-era shape) was fine back when at most one account could ever be
// persisted, but once "+ Add another account" shipped, it silently dropped
// every backgrounded account from the switcher on the next reload/restart, since nothing ever
// re-added them to the live `accounts` map.
export function loadPersistedAccounts() {
  return readPersistedSession()
}

// Drops one account (the active one by default) from persisted storage, e.g. after
// useSessionBootstrap fails to re-validate it against real backend state. Other persisted
// accounts, if any, are left intact rather than wiping the whole blob.
export function clearPersistedAccount(key?: AccountKey) {
  const session = readPersistedSession()
  const targetKey = key ?? session.activeKey
  if (!targetKey) return

  delete session.accounts[targetKey]
  if (session.activeKey === targetKey) {
    session.activeKey = Object.keys(session.accounts)[0] ?? null
  }
  writePersistedSession(session)
}

function persistAccount(account: SignedInAccount) {
  const session = readPersistedSession()
  const key = getAccountKey(account)
  session.accounts[key] = account
  session.activeKey = key
  writePersistedSession(session)
  return key
}

interface SessionStore {
  // Every account that's been signed into and not yet cleared - what the account switcher
  // lists. Populated by `setAccount` (real sign-ins) and `hydrateAccounts` (a
  // startup resume bringing every persisted account back to life, see `useSessionBootstrap`).
  accounts: Record<AccountKey, SignedInAccount>
  activeAccountKey: AccountKey | null
  // Denormalized from `accounts`/`activeAccountKey`, kept in sync on every mutation below - this
  // is the one property most of the app should keep reading (`useSessionStore(state =>
  // state.account)`), unchanged from before this store became account-keyed.
  account: SignedInAccount | null
  setAccount: (account: SignedInAccount) => void
  clearAccount: (key?: AccountKey) => void
  // Not wired to any UI yet - the switcher itself is a later step. Added
  // now so this store's shape doesn't need to change again once that step lands.
  switchAccount: (key: AccountKey) => void
  // Bulk-applies every account `useSessionBootstrap` successfully re-validated on startup in one
  // atomic set, rather than N sequential `setAccount()` calls - `setAccount` always makes its
  // argument the new active account, which is correct for a real sign-in but wrong here (resumes
  // can finish in any order, and only the persisted `activeKey`, if it resumed successfully,
  // should become active - not whichever resume happened to settle last). Also deliberately does
  // NOT re-persist: every account passed in was just read back out of persisted storage, so
  // writing it back would be a no-op at best.
  hydrateAccounts: (
    accounts: Record<AccountKey, SignedInAccount>,
    preferredActiveKey: AccountKey | null,
  ) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  accounts: {},
  activeAccountKey: null,
  account: null,
  setAccount: account => {
    const key = persistAccount(account)
    set(state => ({
      accounts: { ...state.accounts, [key]: account },
      activeAccountKey: key,
      account,
    }))
  },
  clearAccount: key => {
    const state = get()
    const targetKey = key ?? state.activeAccountKey
    if (!targetKey) return

    clearPersistedAccount(targetKey)
    const accounts = { ...state.accounts }
    delete accounts[targetKey]
    const activeAccountKey =
      state.activeAccountKey === targetKey
        ? (Object.keys(accounts)[0] ?? null)
        : state.activeAccountKey

    set({
      accounts,
      activeAccountKey,
      account: activeAccountKey ? (accounts[activeAccountKey] ?? null) : null,
    })
  },
  switchAccount: key => {
    const state = get()
    if (!state.accounts[key]) return

    const session = readPersistedSession()
    session.activeKey = key
    writePersistedSession(session)
    set({ activeAccountKey: key, account: state.accounts[key] })
  },
  hydrateAccounts: (accounts, preferredActiveKey) => {
    set(state => {
      const merged = { ...state.accounts, ...accounts }
      const activeAccountKey =
        preferredActiveKey && merged[preferredActiveKey]
          ? preferredActiveKey
          : (state.activeAccountKey ?? Object.keys(merged)[0] ?? null)

      return {
        accounts: merged,
        activeAccountKey,
        account: activeAccountKey ? (merged[activeAccountKey] ?? null) : null,
      }
    })
  },
}))
