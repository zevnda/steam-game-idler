import type { InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'

export function useInitSettings() {
  const userSummary = useUserStore(s => s.userSummary)
  const setUserSettings = useUserStore(s => s.setUserSettings)

  useEffect(() => {
    if (!userSummary) return
    invoke<InvokeSettings>('get_user_settings', { steamId: userSummary.steamId })
      .then(res => setUserSettings(res.settings))
      .catch(console.error)
  }, [userSummary, setUserSettings])
}
