import type { InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useUserStore } from '@/shared/stores'

export const handleThemeChange = async (
  themeKey: string,
  setTheme: React.Dispatch<React.SetStateAction<string>>,
) => {
  const { userSummary } = useUserStore.getState()

  localStorage.setItem('theme', themeKey)
  setTheme(themeKey)
  await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.theme',
    value: themeKey,
  })
}
