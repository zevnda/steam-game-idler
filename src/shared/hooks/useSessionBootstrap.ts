import type { LocalSteamUser } from '@/features/local-sign-in/types'
import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  clearPersistedAccount,
  loadPersistedAccounts,
  useSessionStore,
} from '@/shared/stores/sessionStore'
import { peekCachedSubscriptionTier } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { computeAllowedAccountKeys } from '@/shared/utils/subscriptionAccess'

type BootstrapPhase = 'checking' | 'idle'

// Thrown by resumeAccount only for a failure that's genuinely unrecoverable no matter how many
// times it's retried - the ONLY case that justifies deleting a persisted account (see
// clearPersistedAccount's call site below). Everything else resumeAccount can throw is treated as
// transient/ambiguous and must never delete real account data, since a resume can fail for reasons
// that have nothing to do with whether the saved credential is actually still good (see the two
// throw sites below for the specific races this covers).
class PermanentResumeFailure extends Error {}

// Caps how long the full-screen boot splash can block on every persisted account resuming, before
// falling back to whatever's resolved so far and letting the rest keep resolving in the background
// (see the `bootstrap` closure below). Not derived from any specific backend deadline - just short
// enough that a normal resume is unaffected, while a stuck one (a revoked token mid
// `AgentProcess::REQUEST_TIMEOUT`'s real 30s IPC round trip, or no route to Steam's CM servers) no
// longer holds every other account's sign-in hostage.
const BOOT_RESUME_TIMEOUT_MS = 4000

// Re-validates one persisted account against real backend state - shared by every entry in the
// persisted accounts map, not just the previously-active one. Deliberately does not blindly trust
// the persisted value the way `main`'s `useInit`/`userSummary` localStorage blob does:
//
// - Agent mode: `agent_login_with_token` actually attempts a logon using the refresh token saved
//   in Windows Credential Manager - a persisted username alone proves nothing. It's also safe to
//   call for an account whose `AgentProcess` is already live and logged on (a webview-only reload
//   leaves the Rust process untouched) - `AgentManager::login_with_token` no-ops instead of
//   re-sending a logon that could disrupt an already-healthy session. That no-op only fires when
//   `AgentProcess::steam_id()` is currently `Some`, though, and a resume landing during a transient
//   reconnect (steam_id briefly nulled) can get a real `LogOnAsync` sent against a mid-reconnect
//   connection, which can legitimately come back non-OK for reasons unrelated to whether the saved
//   token is still good. A bare `false` return here is therefore genuinely ambiguous - it must NOT
//   be treated the same as "no credentials exist at all" below.
// - Local mode: confirmed against a fresh `get_users()` read of `loginusers.vdf` - a persisted
//   steamId for an account the local Steam client no longer knows about would otherwise silently
//   resume into a broken state. But `get_users()` can also fail for unrelated reasons (a transient
//   I/O error), so only a clean read that genuinely omits this steamId means it's actually gone.
async function resumeAccount(account: SignedInAccount) {
  if (account.mode === 'agent') {
    let resumed: boolean
    try {
      resumed = await invoke<boolean>('agent_login_with_token', {
        username: account.username,
      })
    } catch (error) {
      // Rust's AppError::NoSavedAccount serializes to this exact string (see
      // src-tauri/src/error.rs's `code()`) - the one agent-mode failure that really is permanent,
      // since no token existing at all can't be fixed by retrying.
      if (error === 'agent_no_saved_credentials') {
        throw new PermanentResumeFailure('agent_no_saved_credentials')
      }
      throw error
    }
    if (!resumed) {
      throw new Error('agent_resume_failed')
    }
  } else {
    const users = await invoke<LocalSteamUser[]>('get_users')
    if (!users.some(user => user.steamId === account.steamId)) {
      throw new PermanentResumeFailure('local_account_not_found')
    }
  }
}

// Wraps `resumeAccount` so it never rejects - lets the caller `Promise.race` it against
// `BOOT_RESUME_TIMEOUT_MS` without the timeout sentinel and a real rejection racing each other in
// a way that'd need two different catch paths.
function resumeWithOutcome(account: SignedInAccount) {
  return resumeAccount(account).then(
    () => ({ status: 'resumed' as const }),
    error => ({ status: 'failed' as const, error }),
  )
}

// Shared by both the initial (timeout-bounded) pass and the straggler-reconciliation pass below -
// same "only a PermanentResumeFailure deletes real account data" rule either way (see
// `resumeAccount`'s doc comment).
function logAndMaybeClearOnFailure(key: AccountKey, error: unknown) {
  // Deliberately logs the message, not the Error object itself - Next.js dev mode's console.error
  // patch promotes any raw Error instance argument into a full-screen "Runtime Error" overlay,
  // which would make this expected/handled, non-fatal resume failure look like an app crash.
  const reason = error instanceof Error ? error.message : error
  console.error(`Error resuming persisted session for ${key}:`, reason)
  if (error instanceof PermanentResumeFailure) {
    clearPersistedAccount(key)
  }
}

// Attempts to resume every account that was signed in the last time the app was closed (or, on a
// dev webview-only reload, the last time the page loaded), so users aren't dropped back to the
// sign-in screen - or silently missing every backgrounded account from the switcher - on restart.
// Every persisted account is resumed independently and concurrently: one account failing to
// re-validate drops only that account's persisted entry and must not block or fail the others.
//
// Mounted once at the app root (`_app.tsx`), not just the sign-in landing page - real Next.js
// routing means a hard reload can land directly on any `/dashboard/*` URL, not just `/`. Root-
// mounting this means `_app.tsx` can gate rendering of the routed page behind
// `phase !== 'checking'`, so no page's own `if (!account) router.replace('/')` guard ever fires
// against a still-empty, not-yet-hydrated session store.
export const useSessionBootstrap = () => {
  const [phase, setPhase] = useState<BootstrapPhase>('checking')
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const { accounts: persisted, activeKey } = loadPersistedAccounts()
      const entries = Object.entries(persisted) as [AccountKey, SignedInAccount][]
      if (entries.length === 0) {
        if (!cancelled) setPhase('idle')
        return
      }

      // Never reconnect an agent-mode account's live daemon session beyond the current tier's
      // concurrent-account cap - resuming unconditionally here would keep a downgraded user's
      // over-cap automation (idling/farming/unlocking) running in the background indefinitely,
      // reconnected fresh on every restart, even though the switcher already refuses to switch to
      // it. The tier has to be read straight from the cache (not the store) since
      // subscriptionStore doesn't hydrate until DashboardShell mounts, which this hook's own
      // `phase` gates. Over-cap accounts are still merged into the store below (see `resumed`) so
      // they keep appearing dimmed/upsell-only in the switcher exactly like a live-session
      // downgrade already does (see useAgentAccountCapEnforcement) - they just never get their
      // backend session re-established.
      const allowedKeys = computeAllowedAccountKeys(persisted, peekCachedSubscriptionTier())
      const overCapAccounts: Record<AccountKey, SignedInAccount> = {}
      const toResume = entries.filter(([key, account]) => {
        if (allowedKeys.has(key)) return true
        overCapAccounts[key] = account
        return false
      })

      const pending = toResume.map(([key, account]) => ({
        key,
        account,
        result: resumeWithOutcome(account),
      }))

      const timedOut = Symbol('boot-resume-timeout')
      const timeoutPromise = new Promise<typeof timedOut>(resolve =>
        setTimeout(() => resolve(timedOut), BOOT_RESUME_TIMEOUT_MS),
      )

      const raced = await Promise.all(pending.map(p => Promise.race([p.result, timeoutPromise])))

      if (cancelled) return

      const resumed: Record<AccountKey, SignedInAccount> = { ...overCapAccounts }
      const stragglers: typeof pending = []

      pending.forEach((p, index) => {
        const outcome = raced[index]
        if (outcome === timedOut) {
          stragglers.push(p)
        } else if (outcome.status === 'resumed') {
          resumed[p.key] = p.account
        } else {
          logAndMaybeClearOnFailure(p.key, outcome.error)
        }
      })

      // Route the initial decision purely off whatever's resolved within the timeout budget - the
      // stragglers resolve on their own below and get folded into the switcher whenever they do,
      // without yanking the user off whatever screen they're on. A slow account isn't dropped, it
      // just doesn't get to hold up everyone else's boot.
      if (Object.keys(resumed).length > 0) {
        useSessionStore.getState().hydrateAccounts(resumed, activeKey)
        // Only navigate when starting from outside /dashboard/* (the normal cold-start-at-`/`
        // case) - a reload that landed directly on e.g. `/dashboard/card-farming` should resume in
        // place, not get yanked back to the dashboard root.
        if (!router.pathname.startsWith('/dashboard')) {
          router.replace('/dashboard')
        }
      }
      setPhase('idle')

      if (stragglers.length > 0) {
        Promise.all(stragglers.map(p => p.result)).then(results => {
          if (cancelled) return
          const lateResumed: Record<AccountKey, SignedInAccount> = {}
          stragglers.forEach((p, index) => {
            const outcome = results[index]
            if (outcome.status === 'resumed') {
              lateResumed[p.key] = p.account
            } else {
              logAndMaybeClearOnFailure(p.key, outcome.error)
            }
          })
          if (Object.keys(lateResumed).length > 0) {
            useSessionStore.getState().hydrateAccounts(lateResumed, activeKey)
            // Mirror the initial pass's navigation: a straggler resolving late still means a
            // genuinely valid session just became available, and the user must not be left
            // stranded on the sign-in screen (`pages/index.tsx`) with no way back short of a
            // manual sign-in or app restart. Only yank them over if they're still outside
            // /dashboard/* - if they already navigated there themselves (e.g. by finishing a
            // manual sign-in for a different account while this one was still resolving), leave
            // them where they are.
            if (!router.pathname.startsWith('/dashboard')) {
              router.replace('/dashboard')
            }
          }
        })
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
    // Only ever meant to run once, on mount - re-running on router identity changes would risk
    // re-resuming a session that was just explicitly signed out of.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return phase
}
