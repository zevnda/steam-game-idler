import type { PresenceSettings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from './useTabGatedLoad'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Backs the persona-state/custom-idle-status rows in GeneralSettingsTab - per-account (agent-mode
// only, no CLI-mode equivalent), unlike the rest of that tab's app-wide settings
// (`useSettingsModal`). Self-contained rather than lifted into
// SettingsModal.tsx, matching how GeneralSettingsTab already reads several other per-account/live
// stores directly (session, subscription, anti-away, ...) instead of taking every value as a prop.
export const usePresenceSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const username = account?.mode === 'agent' ? account.username : null
  const [settings, setSettings] = useState<PresenceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!username) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(await invoke<PresenceSettings>('agent_get_presence_settings', { username }))
    } catch (error) {
      console.error('Error in (agent_get_presence_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [username])

  useTabGatedLoad(isOpen && activeTab === 'general' && !!username, username, load)

  const save = useCallback(
    async (next: PresenceSettings) => {
      if (!username) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        setSettings(
          await invoke<PresenceSettings>('agent_set_presence_settings', {
            username,
            settings: next,
          }),
        )
        logFrontendInfo('usePresenceSettings', 'presence settings saved', {
          personaState: next.personaState,
          hasCustomIdleStatus: Boolean(next.customIdleStatus),
        })
        return true
      } catch (error) {
        console.error('Error in (agent_set_presence_settings):', error)
        setActionErrorCode(String(error))
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [username],
  )

  return {
    isAgentAccount: username !== null,
    settings,
    isLoading,
    isSaving,
    loadErrorCode,
    actionErrorCode,
    refresh: load,
    save,
  }
}
