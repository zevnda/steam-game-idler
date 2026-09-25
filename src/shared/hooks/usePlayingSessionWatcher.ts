import type { AgentEventPayload } from '@/features/agent-sign-in/types'
import type { PlayingSession } from '@/shared/stores/playingSessionStore'
import type { AccountKey } from '@/shared/stores/sessionStore'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { AGENT_EVENT_NAME } from '@/features/agent-sign-in/types'
import { usePlayingSessionStore } from '@/shared/stores/playingSessionStore'
import { getAccountKey } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// Mounted once from DashboardShell. Keeps playingSessionStore current from the daemon's
// `playing_session` events, plus one `get_agent_playing_sessions` snapshot on mount - a block that
// started before this listener existed (the user was already mid-game when SGI launched and
// resumed its saved sessions) would otherwise never show. No log breadcrumb here: the Rust host
// already logs every transition (steam_agent::process::handle_line), this is display-only.
export const usePlayingSessionWatcher = () => {
  useEffect(() => {
    let cancelled = false
    // Accounts an event has already reported on - the snapshot below must not overwrite those,
    // since it may have been taken before that (newer) event.
    const reportedKeys = new Set<AccountKey>()

    const unlisten = listen<AgentEventPayload>(AGENT_EVENT_NAME, ({ payload }) => {
      const key = getAccountKey({ mode: 'agent', username: payload.account })

      if (payload.event === 'playing_session') {
        reportedKeys.add(key)
        const session = payload.payload as unknown as PlayingSession
        usePlayingSessionStore.getState().set(key, {
          blocked: Boolean(session.blocked),
          appId: session.appId ?? null,
          sinceMs: session.sinceMs ?? null,
        })
        return
      }

      // A session that's gone for good (signed out, or terminally replaced - see
      // useAgentReauthWatcher) can't report its own unblock anymore, so drop any pause it left.
      // "Reconnecting" deliberately doesn't clear - a "playing elsewhere" kick reconnects while
      // staying paused.
      if (payload.event === 'status_changed') {
        const result = payload.payload.result
        if (result === 'Disconnected' || result === 'LoggedInElsewhere') {
          reportedKeys.add(key)
          usePlayingSessionStore.getState().set(key, { blocked: false, appId: null, sinceMs: null })
        }
      }
    })

    invoke<Record<string, PlayingSession>>('get_agent_playing_sessions')
      .then(sessions => {
        if (cancelled) return
        for (const [username, session] of Object.entries(sessions)) {
          const key = getAccountKey({ mode: 'agent', username })
          if (!reportedKeys.has(key)) usePlayingSessionStore.getState().set(key, session)
        }
      })
      .catch(error => {
        console.error('Error in (get_agent_playing_sessions):', error)
      })

    return () => {
      cancelled = true
      unlisten.then(stop => stop())
    }
  }, [])
}
