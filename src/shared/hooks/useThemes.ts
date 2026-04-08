import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { showDangerToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { isMissingTauriInvokeError, logEvent } from '@/shared/utils'

export function useThemes() {
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  const isPro = useUserStore(state => state.isPro)
  const userSummary = useUserStore(state => state.userSummary)

  useEffect(() => {
    const applyThemeForUser = async () => {
      try {
        if (!userSummary) return

        const html = document.documentElement
        let userTheme = localStorage.getItem('theme') || 'dark'

        if (!isPro) {
          userTheme = 'dark'
        }

        // Always reset classes and apply the correct one
        html.className = ''
        html.classList.add(userTheme)
        localStorage.setItem('theme', userTheme)
        setTheme(userTheme)
      } catch (error) {
        if (isMissingTauriInvokeError(error)) {
          const fallbackTheme = localStorage.getItem('theme') || 'dark'
          document.documentElement.className = ''
          document.documentElement.classList.add(fallbackTheme)
          setTheme(fallbackTheme)
          return
        }

        showDangerToast(t('common.error'))
        console.error('Error in (applyThemeForUser):', error)
        logEvent(`[Error] in (applyThemeForUser): ${error}`)
      }
    }

    applyThemeForUser()
  }, [userSummary, isPro, setTheme, t])
}
