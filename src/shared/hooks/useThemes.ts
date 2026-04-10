import type { InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { showDangerToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { hasCasualFeature, logEvent } from '@/shared/utils'

export function useThemes() {
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  const proTier = useUserStore(state => state.proTier)
  const userSummary = useUserStore(state => state.userSummary)

  useEffect(() => {
    const applyThemeForUser = async () => {
      try {
        if (!userSummary) return

        const html = document.documentElement
        // Themes
        const proThemes = ['blue', 'red', 'purple', 'pink', 'gold', 'black']
        let userTheme = 'dark'

        // Get user settings if available
        if (hasCasualFeature(proTier)) {
          const cachedUserSettings = await invoke<InvokeSettings>('get_user_settings', {
            steamId: userSummary.steamId,
          })
          userTheme = cachedUserSettings.settings.general.theme || 'dark'
        } else {
          // If not pro, remove any pro themes
          const currentTheme = localStorage.getItem('theme')
          if (currentTheme && proThemes.includes(currentTheme)) {
            userTheme = 'dark'
          } else {
            userTheme = currentTheme || 'dark'
          }
        }

        // Always reset classes and apply the correct one
        html.className = ''
        html.classList.add(userTheme)
        localStorage.setItem('theme', userTheme)
        setTheme(userTheme)
      } catch (error) {
        showDangerToast(t('common.error'))
        console.error('Error in (applyThemeForUser):', error)
        logEvent(`[Error] in (applyThemeForUser): ${error}`)
      }
    }

    applyThemeForUser()
  }, [userSummary, proTier, setTheme, t])
}
