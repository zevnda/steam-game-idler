import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

interface IdleStateEventPayload {
  // Only present for agent-mode accounts - the daemon's `idle_state` event forwards the resolved,
  // normalized username (see steam_agent/process.rs). CLI mode's IdlingManager is a process-wide
  // singleton with no account field at all: a real local Steam client can only ever be logged into
  // one account at a time, so there's no ambiguity to resolve - absence of
  // this field always means "the one signed-in CLI-mode account, whichever that is."
  account?: string
  appIds: number[]
}

// Matches src-tauri/src/idling/mod.rs's IDLE_STATE_EVENT constant.
const IDLE_STATE_EVENT = 'idling-state-changed'

// Resolves the sole CLI-mode ("local") account currently in sessionStore, if any - independent of
// which account is denormalized as "active", since a CLI-mode event can arrive while a different
// (agent-mode) account is the one being viewed. Only ever at most one such account can exist (see
// the payload comment above), so there's no ambiguity in picking "the" local entry.
function resolveCliAccountKey() {
  const entry = Object.entries(useSessionStore.getState().accounts).find(
    ([, account]) => account.mode === 'local',
  )
  return entry?.[0] ?? null
}

// Refetches get_idle_claims for `key` and stores the result - called after every appIds change
// (initial fetch + each event) rather than derived from the event payload, since neither backend's
// IDLE_STATE_EVENT emit site has (or needs) owner info - see idling::claims::IdleClaimsRegistry's
// doc comment. The claims registry is already the authority those emit sites read their app ids
// from, so a fetch right after any appIds change stays consistent with what the page just saw.
// Takes `account` explicitly (rather than reading sessionStore's denormalized "active" account)
// since this must resolve correctly for a backgrounded account's event too, same reasoning as
// resolveCliAccountKey above.
export function syncClaims(
  key: AccountKey,
  account: SignedInAccount,
  setClaimsByOwner: (key: AccountKey, claimsByOwner: Record<string, number[]>) => void,
) {
  invoke<Record<string, number[]>>('get_idle_claims', { account })
    .then(claimsByOwner => setClaimsByOwner(key, claimsByOwner))
    .catch(error => {
      console.error('Error in (get_idle_claims):', error)
    })
}

// Keeps `idlingStore` in sync with the backend regardless of which /dashboard/* route is active.
// Mounted once from `DashboardShell` (not from the idling page itself) so the tracked app ids -
// and the elapsed-time start timestamps derived from them - survive navigating away from the
// idling page and back: `useIdlingStore`'s entries persist per account across that navigation.
//
// Only syncs the active account's initial state via `get_idle_state` - matching
// `useGamesListSync`'s same scope limit. The event listener
// below, however, is global by nature (Tauri events aren't scoped to one account), so it routes
// every incoming event to the right entry via the payload's `account` field (or the CLI-mode
// fallback above) regardless of which account is currently active - keeping a backed-off account's
// idling badge correct for whenever the account switcher lands, the same way gamesListStore's
// `entries` already cache a backgrounded account's games.
export const useIdlingSync = () => {
  const account = useSessionStore(state => state.account)
  const setActiveAccount = useIdlingStore(state => state.setActiveAccount)
  const setAppIds = useIdlingStore(state => state.setAppIds)
  const setClaimsByOwner = useIdlingStore(state => state.setClaimsByOwner)

  useEffect(() => {
    if (!account) return
    const key = getAccountKey(account)
    setActiveAccount(key)
    let cancelled = false

    invoke<number[]>('get_idle_state', { account })
      .then(appIds => {
        if (!cancelled) {
          setAppIds(key, appIds)
          syncClaims(key, account, setClaimsByOwner)
        }
      })
      .catch(error => {
        console.error('Error in (get_idle_state):', error)
      })

    const unlisten = listen<IdleStateEventPayload>(IDLE_STATE_EVENT, event => {
      const eventKey = event.payload.account
        ? getAccountKey({ mode: 'agent', username: event.payload.account })
        : resolveCliAccountKey()
      const eventAccount = eventKey ? useSessionStore.getState().accounts[eventKey] : undefined
      if (eventKey && eventAccount) {
        setAppIds(eventKey, event.payload.appIds)
        syncClaims(eventKey, eventAccount, setClaimsByOwner)
      }
    })

    return () => {
      cancelled = true
      unlisten.then(fn => fn())
    }
  }, [account, setActiveAccount, setAppIds, setClaimsByOwner])
}
