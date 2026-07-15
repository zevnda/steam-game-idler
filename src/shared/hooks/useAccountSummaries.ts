import { useEffect } from 'react'
import { useAccountSummaryStore } from '@/shared/stores/accountSummaryStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { resolveAccountSummary } from '@/shared/utils/resolveAccountSummary'

// Resolves persona name + avatar for every signed-in account, agent or local - unlike local-sign-in
// (whose own screen fetches this transiently, just for its own account picker), this is the first
// place anything persists that data for agent-mode accounts, or for longer than one sign-in screen's
// lifetime. Mounted once in DashboardShell (alongside the other sync hooks) so the account switcher
// can show a real avatar/name per account regardless of which one is active.
// A failed lookup just leaves that account unresolved - callers fall back to the raw identifier,
// this isn't fatal to anything. Concurrent-request de-dupe (e.g. AddAccountModal awaiting the same
// key this effect just started resolving) lives in resolveAccountSummary itself, not here.
export const useAccountSummaries = () => {
  const accounts = useSessionStore(state => state.accounts)
  const summaries = useAccountSummaryStore(state => state.summaries)

  useEffect(() => {
    for (const [key, account] of Object.entries(accounts)) {
      if (summaries[key]) continue
      resolveAccountSummary(key, account).catch(error => {
        console.error('Error resolving account summary:', error)
      })
    }
  }, [accounts, summaries])
}
