import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'

export function useDiscordPresence() {
  const userSettings = useUserStore(s => s.userSettings)

  useEffect(() => {
    const update = async () => {
      try {
        if (userSettings.general.discordPresence) {
          await invoke('start_drp')
        } else {
          await invoke('stop_drp')
        }
      } catch (error) {
        console.error('Error in setDiscordPresence:', error)
      }
    }
    update()
  }, [userSettings.general.discordPresence])
}
