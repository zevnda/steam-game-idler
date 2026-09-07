import type { AiChatApiResponse, AiChatHistoryEntry } from '@/shared/utils/aiChatApi'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiChatStore } from '@/shared/stores/aiChatStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { AI_CHAT_API_URL } from '@/shared/utils/aiChatApi'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

const LICENSE_KEY_STORAGE_KEY = 'licenseKey'

// Mirrors useCheckSubscription.ts's resolveSteamId - local mode already has a SteamID64, agent
// mode needs the backend to resolve one from its live session.
async function resolveSteamId(
  account: NonNullable<ReturnType<typeof useSessionStore.getState>['account']>,
) {
  if (account.mode === 'local') return account.steamId
  return invoke<string>('resolve_account_steam_id', { account })
}

// Sends a question to apibase's /api/ai-chat (Voyage retrieval + Claude Haiku, quota-enforced
// server-side) and appends both sides of the exchange to aiChatStore. No Tauri command/capability
// needed for the HTTP call itself - same plain-fetch pattern useCheckSubscription.ts already uses
// against the same host, see subscriptionApi.ts.
export function useAiChat() {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const addMessage = useAiChatStore(state => state.addMessage)
  const setSending = useAiChatStore(state => state.setSending)
  const setQuota = useAiChatStore(state => state.setQuota)
  const clearQuota = useAiChatStore(state => state.clearQuota)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)

  // The daily quota is keyed server-side by license key (or device fingerprint for an unlicensed
  // caller) - activating a license key mid-session, or a tier change from a plan swap, moves the
  // caller to a different identity/cap entirely. Without this, a cached `quota` object from the old
  // identity (e.g. a maxed-out free-tier fingerprint) keeps `isInputDisabled` true forever, since
  // nothing else ever triggers a fresh request to learn the new identity's real (reset) usage.
  const previousTierRef = useRef(subscriptionTier)
  useEffect(() => {
    if (previousTierRef.current !== subscriptionTier) {
      previousTierRef.current = subscriptionTier
      clearQuota()
    }
  }, [subscriptionTier, clearQuota])

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return

      // Captured before this turn's user message is appended below, so it's exactly the prior
      // exchange - bounded to one user+assistant pair on purpose (see aiChatApi.ts's AiChatHistoryEntry
      // doc comment for why: unbounded history would grow the retrieved-sources input cost on every
      // single turn of a long conversation, not just this one).
      const lastTwo = useAiChatStore.getState().messages.slice(-2)
      const history: AiChatHistoryEntry[] =
        lastTwo.length === 2 && lastTwo[0].role === 'user' && lastTwo[1].role === 'assistant'
          ? [
              { role: 'user', content: lastTwo[0].content },
              { role: 'assistant', content: lastTwo[1].content },
            ]
          : []

      addMessage({ id: crypto.randomUUID(), role: 'user', content: trimmed })
      setSending(true)

      try {
        const licenseKey = localStorage.getItem(LICENSE_KEY_STORAGE_KEY)
        const deviceFingerprint = await invoke<string>('get_device_fingerprint')
        const steamId = account ? await resolveSteamId(account) : undefined

        const response = await fetch(AI_CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey,
            steamId,
            deviceFingerprint,
            question: trimmed,
            history,
          }),
        })

        const data = (await response.json()) as AiChatApiResponse
        if (data.quota) setQuota(data.quota)

        if (!response.ok || data.error || !data.answer) {
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              response.status === 429
                ? t('aiChat.errors.quotaExceeded')
                : t('aiChat.errors.generic'),
          })
          return
        }

        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
        })
      } catch (error) {
        logFrontendWarn('useAiChat', 'AI chat request failed', { error: String(error) })
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: t('aiChat.errors.generic'),
        })
      } finally {
        setSending(false)
      }
    },
    [account, addMessage, setSending, setQuota, t],
  )

  return { sendQuestion }
}
