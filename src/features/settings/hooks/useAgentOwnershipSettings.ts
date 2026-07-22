import type { OwnershipSettings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from './useTabGatedLoad'
import { fetchGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

export const useAgentOwnershipSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const username = account?.mode === 'agent' ? account.username : null
  const [settings, setSettings] = useState<OwnershipSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!username) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(await invoke<OwnershipSettings>('agent_get_ownership_settings', { username }))
    } catch (error) {
      console.error('Error in (agent_get_ownership_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [username])

  useTabGatedLoad(isOpen && activeTab === 'general' && !!username, username, load)

  // Toggling this setting changes what `get_owned_games` returns, so it re-fetches the games list
  // immediately once the save resolves - the user shouldn't have to wait for the next natural
  // refresh to see the new scope take effect.
  const save = useCallback(
    async (next: OwnershipSettings) => {
      if (!username || !account) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        setSettings(
          await invoke<OwnershipSettings>('agent_set_ownership_settings', {
            username,
            settings: next,
          }),
        )
        logFrontendInfo('useAgentOwnershipSettings', 'ownership settings saved', {
          gamesOnly: next.gamesOnly,
        })
        fetchGamesList(account, { showLoadingState: true })
        return true
      } catch (error) {
        console.error('Error in (agent_set_ownership_settings):', error)
        setActionErrorCode(String(error))
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [username, account],
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
