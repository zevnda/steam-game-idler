import type { AiChatApiResponse } from '@/shared/utils/aiChatApi'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiChatStore } from '@/shared/stores/aiChatStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
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

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return

      addMessage({ id: crypto.randomUUID(), role: 'user', content: trimmed })
      setSending(true)

      try {
        const licenseKey = localStorage.getItem(LICENSE_KEY_STORAGE_KEY)
        const deviceFingerprint = await invoke<string>('get_device_fingerprint')
        const steamId = account ? await resolveSteamId(account) : undefined

        const response = await fetch(AI_CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseKey, steamId, deviceFingerprint, question: trimmed }),
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
          sources: data.sources,
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
