import type { AgentEventPayload, QrChallenge } from '../types'
import { listen } from '@tauri-apps/api/event'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AGENT_EVENT_NAME } from '../types'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

export type QrSignInPhase =
  | { kind: 'starting' }
  | { kind: 'challenge'; challengeUrl: string }
  | { kind: 'success' }
  | { kind: 'error' }

// An un-scanned QR going stale surfaces as one of two distinct SteamKit2 exceptions, verified
// against real logs rather than assumed: (1) `AuthenticationException`, whose `Message` is
// formatted as "{message} with result {result}." (`Expired` is the poll EResult for a code nobody
// scanned) - see `AuthFlow.cs::LoginWithQrAsync`'s catch block, which forwards `ex.Message`
// verbatim as this event's `error`; (2) `AsyncJobFailedException`, SteamKit2's generic
// job-timeout exception (its parameterless-ctor default .NET message, no embedded detail) when the
// underlying poll's CM connection drops before Steam ever returns a clean `Expired` result -
// observed in practice alongside two `status_changed` events (a disconnect) right before
// `login_failed`. Since (2)'s message carries no detail, it's ambiguous with a genuine persistent
// connectivity problem - `MAX_AUTO_RETRIES` below bounds how many times this auto-restarts before
// falling back to the visible error + manual "Try again" state.
const isRecoverableQrTimeout = (code: string) =>
  /with result Expired\.$/.test(code) || code.includes('AsyncJobFailedException')

// Caps consecutive silent auto-restarts (reset once a real challenge renders again - see the
// `qr_challenge_url` handler) so a genuinely persistent problem still surfaces after a few cycles
// instead of retrying forever with no visible indication anything's wrong.
const MAX_AUTO_RETRIES = 2

// Mirrors `useAgentSignIn.ts`'s event-filtering shape, but keyed by the opaque `sessionKey` from
// `agent_begin_qr_login` instead of a normalized username - see `QrChallenge`'s doc comment in
// types.ts for why no username exists until `refresh_token` resolves one.
export const useAgentQrSignIn = () => {
  const [phase, setPhase] = useState<QrSignInPhase>({ kind: 'starting' })
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const sessionKeyRef = useRef<string | null>(null)
  const autoRetryCountRef = useRef(0)

  // `AgentManager::cancel_qr_login` is documented as a no-op once `sessionKey` has already
  // resolved (promoted into the real `sessions` map) or never existed, so this is always safe to
  // call - on unmount after success, after a `login_failed` event, or a genuine user cancel.
  const cancel = useCallback(async () => {
    const sessionKey = sessionKeyRef.current
    sessionKeyRef.current = null
    if (sessionKey) {
      await invoke('agent_cancel_qr_login', { sessionKey }).catch(() => {})
    }
  }, [])

  const start = useCallback(async () => {
    setErrorCode(null)
    setPhase({ kind: 'starting' })

    try {
      const challenge = await invoke<QrChallenge>('agent_begin_qr_login')
      sessionKeyRef.current = challenge.sessionKey
      setPhase({ kind: 'challenge', challengeUrl: challenge.challengeUrl })
    } catch (error) {
      sessionKeyRef.current = null
      setErrorCode(String(error))
      setPhase({ kind: 'error' })
    }
  }, [])

  useEffect(() => {
    const unlisten = listen<AgentEventPayload>(AGENT_EVENT_NAME, ({ payload }) => {
      if (payload.account !== sessionKeyRef.current) {
        return
      }

      if (payload.event === 'qr_challenge_url') {
        // Steam rotates the challenge every ~20-30s until scanned - each rotation replaces the
        // rendered code rather than appending a new one.
        const challengeUrl = payload.payload.challengeUrl
        if (typeof challengeUrl === 'string') {
          // A live challenge actually rendered, so a subsequent timeout starts a fresh retry
          // budget rather than counting against whatever budget an earlier session used up.
          autoRetryCountRef.current = 0
          setPhase({ kind: 'challenge', challengeUrl })
        }
      } else if (payload.event === 'refresh_token') {
        const username = payload.payload.username
        if (typeof username === 'string') {
          useSessionStore.getState().setAccount({ mode: 'agent', username })
        }
        sessionKeyRef.current = null
        setPhase({ kind: 'success' })
      } else if (payload.event === 'login_failed') {
        // The daemon process behind this session_key is still resident in `pending_qr` at this
        // point (only `refresh_token` promotes/removes it) - cancel to kill it rather than
        // leaking it, same as an explicit user cancel would.
        void cancel()
        const error =
          typeof payload.payload.error === 'string' ? payload.payload.error : 'agent_unknown_error'
        if (isRecoverableQrTimeout(error) && autoRetryCountRef.current < MAX_AUTO_RETRIES) {
          // Mirrors Steam's own web sign-in page: an un-scanned QR silently gets a fresh one
          // instead of surfacing an error the user has to notice and dismiss via "Try again".
          autoRetryCountRef.current += 1
          logFrontendInfo(
            'useAgentQrSignIn',
            'QR code timed out unscanned - requesting a new one',
            {
              error,
              attempt: autoRetryCountRef.current,
            },
          )
          void start()
          return
        }
        setErrorCode(error)
        setPhase({ kind: 'error' })
      }
    })

    return () => {
      unlisten.then(stop => stop())
    }
  }, [cancel, start])

  return { phase, errorCode, start, cancel }
}
