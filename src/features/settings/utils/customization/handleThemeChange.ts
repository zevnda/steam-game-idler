import type { InvokeSettings } from '@/shared/types'
import { useUserStore } from '@/shared/stores'
import { invokeSafe } from '@/shared/utils'

export const handleThemeChange = async (
  themeKey: string,
  setTheme: React.Dispatch<React.SetStateAction<string>>,
) => {
  const { userSummary } = useUserStore.getState()

  localStorage.setItem('theme', themeKey)
  setTheme(themeKey)
  await invokeSafe<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.theme',
    value: themeKey,
  })
}
