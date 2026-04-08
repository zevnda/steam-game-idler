import type { InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { isTauriRuntime } from '@/shared/utils'

export function useInitSettings() {
  const userSummary = useUserStore(state => state.userSummary)
  const setUserSettings = useUserStore(state => state.setUserSettings)

  useEffect(() => {
    const getAndSetUserSettings = async () => {
      if (!isTauriRuntime) return
      if (userSummary) {
        const response = await invoke<InvokeSettings>('get_user_settings', {
          steamId: userSummary.steamId,
        })
        setUserSettings(response.settings)
      }
    }
    getAndSetUserSettings()
  }, [userSummary, setUserSettings])
}
