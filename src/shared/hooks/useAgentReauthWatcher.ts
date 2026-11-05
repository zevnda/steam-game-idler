import type { AgentEventPayload } from '@/features/agent-sign-in/types'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { AGENT_EVENT_NAME } from '@/features/agent-sign-in/types'
import { useAgentReauthStore } from '@/shared/stores/agentReauthStore'
import { useReauthModalStore } from '@/shared/stores/reauthModalStore'
import { getAccountKey } from '@/shared/stores/sessionStore'

// Which daemon event means this account's session has ended for good, and why. Null for everything
// else - including the user playing on their real Steam client, which usePlayingSessionWatcher
// handles as a pause instead, and a plain network drop, which the daemon reconnects by itself.
function sessionEndReason({ event, payload }: AgentEventPayload) {
  if (event === 'session_rejected') return 'sessionEnded' as const
  if (event === 'status_changed' && payload.result === 'LoggedInElsewhere')
    return 'replaced' as const
  return null
}

// Mounted once from DashboardShell (not useAgentSignIn's sign-in-flow listener, which only runs
// while a sign-in form is active and is otherwise the sole consumer of `steam-agent-event` today)
// so a session ending for good is caught regardless of what the user is doing at the time. The Rust
// host (steam_agent::process::handle_session_lost) already stopped this account's
// automation by the time this event arrives - this hook drives the UI two ways: a persistent
// agentReauthStore flag for the account switcher badge, and immediately opening ReauthModal itself
// - a badge alone is too easy to miss for something this disruptive (confirmed in testing), so the
// sign-in prompt surfaces itself rather than waiting for the user to notice the badge and click it.
// No separate toast - ReauthModal popping up already is the notification, and showing both would
// just be two alerts for the same event. Both clear/stay resolved together via the `loggedOn: true`
// branch below, firing naturally once ReauthModal's sign-in succeeds - closing the modal there (see
// its onClose) doesn't re-open it, this effect only opens it once per session ending.
export const useAgentReauthWatcher = () => {
  useEffect(() => {
    const unlisten = listen<AgentEventPayload>(AGENT_EVENT_NAME, ({ payload }) => {
      const key = getAccountKey({ mode: 'agent', username: payload.account })
      const reason = sessionEndReason(payload)

      if (reason) {
        useAgentReauthStore.getState().flag(key, reason)
        useReauthModalStore.getState().open(key)
      } else if (payload.event === 'status_changed' && payload.payload.loggedOn === true) {
        useAgentReauthStore.getState().clear(key)
      }
    })

    return () => {
      unlisten.then(stop => stop())
    }
  }, [])
}
