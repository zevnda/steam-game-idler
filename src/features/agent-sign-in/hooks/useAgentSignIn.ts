import type { AgentEventPayload, LoginOutcome } from '../types'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'
import { AGENT_EVENT_NAME } from '../types'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

type SignInPhase =
  | { kind: 'form' }
  | { kind: 'submitting' }
  | {
      kind: 'guardCode'
      guardType: string
      detail: string | null
      isSubmitting: boolean
      isIncorrect: boolean
    }
  | { kind: 'success' }

// Normalizes the same way `AgentManager::key_for` does on the Rust side (trim + lowercase) - the
// `account` field on every `steam-agent-event` payload is this normalized key, not the raw input,
// so events can only be matched against a session by comparing like for like.
const normalizeUsername = (username: string) => username.trim().toLowerCase()

export const useAgentSignIn = () => {
  const [phase, setPhase] = useState<SignInPhase>({ kind: 'form' })
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const activeAccountRef = useRef<string | null>(null)

  useEffect(() => {
    const unlisten = listen<AgentEventPayload>(AGENT_EVENT_NAME, ({ payload }) => {
      if (payload.account !== activeAccountRef.current) {
        return
      }

      // These three events are the only ones a guard-code prompt can resolve into - see
      // AuthFlow.cs's `RespondOnce`/`WaitForGuardCodeAsync`: a "need_guard_code" response is only
      // ever sent once per login attempt, so success/failure/retry after that point only ever
      // arrive as one of these async events instead of a second response to the original request.
      if (payload.event === 'refresh_token') {
        // `payload.account` is already the normalized key (see the comment above) - the same
        // identifier `games::commands::GamesAccount::Agent`'s `username` field gets resolved
        // through on the Rust side (`AgentManager::key_for` normalizes again either way).
        useSessionStore.getState().setAccount({ mode: 'agent', username: payload.account })
        setPhase({ kind: 'success' })
      } else if (payload.event === 'login_failed') {
        activeAccountRef.current = null
        setPhase({ kind: 'form' })
        setErrorCode(
          typeof payload.payload.error === 'string' ? payload.payload.error : 'agent_unknown_error',
        )
      } else if (payload.event === 'guard_code_incorrect') {
        setPhase(prev =>
          prev.kind === 'guardCode' ? { ...prev, isSubmitting: false, isIncorrect: true } : prev,
        )
      }
    })

    return () => {
      unlisten.then(stop => stop())
    }
  }, [])

  const signIn = async (username: string, password: string) => {
    const account = normalizeUsername(username)
    activeAccountRef.current = account
    setErrorCode(null)
    setPhase({ kind: 'submitting' })

    try {
      const outcome = await invoke<LoginOutcome>('agent_login', { username, password })
      applyOutcome(outcome)
    } catch (error) {
      activeAccountRef.current = null
      setPhase({ kind: 'form' })
      setErrorCode(String(error))
    }
  }

  const applyOutcome = (outcome: LoginOutcome) => {
    if (outcome.status === 'success') {
      if (activeAccountRef.current) {
        useSessionStore.getState().setAccount({ mode: 'agent', username: activeAccountRef.current })
      }
      setPhase({ kind: 'success' })
    } else if (outcome.status === 'needGuardCode') {
      setPhase({
        kind: 'guardCode',
        guardType: outcome.guardType,
        detail: outcome.detail,
        isSubmitting: false,
        isIncorrect: false,
      })
    } else {
      setPhase({
        kind: 'guardCode',
        guardType: 'confirmation',
        detail: null,
        isSubmitting: false,
        isIncorrect: false,
      })
    }
  }

  const submitGuardCode = async (code: string) => {
    if (phase.kind !== 'guardCode' || !activeAccountRef.current) {
      return
    }

    setPhase({ ...phase, isSubmitting: true, isIncorrect: false })

    try {
      await invoke('agent_submit_guard_code', { username: activeAccountRef.current, code })
      // The submit_guard_code response only confirms Steam received the code - the actual
      // outcome (correct/incorrect/success) arrives later as one of the events handled above, so
      // the UI stays in a submitting state until then rather than resolving here.
    } catch (error) {
      setPhase(prev => (prev.kind === 'guardCode' ? { ...prev, isSubmitting: false } : prev))
      setErrorCode(String(error))
    }
  }

  const cancel = () => {
    activeAccountRef.current = null
    setErrorCode(null)
    setPhase({ kind: 'form' })
  }

  return { phase, errorCode, signIn, submitGuardCode, cancel }
}
