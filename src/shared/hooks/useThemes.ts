import type { InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'
import { hasCasualFeature } from '@/shared/utils'

export function useThemes() {
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  const proTier = useUserStore(s => s.proTier)
  const userSummary = useUserStore(s => s.userSummary)

  useEffect(() => {
    const applyTheme = async () => {
      try {
        if (!userSummary) return

        const proThemes = ['blue', 'red', 'purple', 'pink', 'gold', 'black']
        let userTheme = 'dark'

        if (hasCasualFeature(proTier)) {
          const res = await invoke<InvokeSettings>('get_user_settings', {
            steamId: userSummary.steamId,
          })
          userTheme = res.settings.general.theme || 'dark'
        } else {
          const currentTheme = localStorage.getItem('theme')
          userTheme = currentTheme && !proThemes.includes(currentTheme) ? currentTheme : 'dark'
        }

        const html = document.documentElement
        html.className = ''
        html.classList.add(userTheme)
        localStorage.setItem('theme', userTheme)
        setTheme(userTheme)
      } catch (error) {
        toast.danger(t('common.error'))
        console.error('Error in applyTheme:', error)
        await logEvent(`[Error] in (applyThemeForUser): ${error}`)
      }
    }
    applyTheme()
  }, [userSummary, proTier, setTheme, t])
}
