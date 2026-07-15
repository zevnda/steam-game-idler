import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@/shared/utils/invoke'

// The system tray has no React tree to read `useTranslation()` from, so the translated labels are
// pushed down to Rust (`tray::update_tray_menu`) instead - on mount (to replace the hardcoded
// English defaults `tray::setup` builds before the frontend has loaded) and again whenever the
// user's language changes. Mirrors `main`'s `useInit.ts` tray-sync effect.
export function useTraySync() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    invoke('update_tray_menu', {
      show: t('tray.show'),
      recenter: t('tray.recenter'),
      update: t('tray.update'),
      quit: t('tray.quit'),
    }).catch(error => {
      console.error('Error in (update_tray_menu):', error)
    })
  }, [t, i18n.language])
}
