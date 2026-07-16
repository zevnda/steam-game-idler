import { useTranslation } from 'react-i18next'
import { ProgressBar } from '@heroui/react'
import { SplashScreen } from '@/shared/components/SplashScreen'

// In-app-update splash screen - shown for the whole duration of `performUpdate` (see
// src/shared/utils/update.ts), driven by `updateStore.isUpdating`. Covers both paths that set it:
// the silent auto-install (a major update, or the very first check since app start - see
// useCheckForUpdates) and the opt-in UpdateButton click. No fade-out lifecycle like
// FullscreenLoader needs - `performUpdate` always ends in either a `relaunch()` (the whole window
// closes) or a caught error that resets `isUpdating` back to false, so there's no intermediate
// state to animate out of.
//
// `ProgressBar` renders indeterminate automatically when it's given no `value` (see
// @heroui/styles' progress-bar.css - the animated fill only activates `:not([aria-valuenow])`),
// matching `main`'s `isIndeterminate` Progress usage. Track/fill colors are forced to white via
// inline `style` (not className) since HeroUI's default color tokens aren't guaranteed to resolve
// to pure white against this splash screen's black backdrop the way `main`'s dedicated
// `bg-white/20`/`bg-white` classes did.
export const UpdateLoader = () => {
  const { t } = useTranslation()

  return (
    <SplashScreen>
      <div className='flex w-64 flex-col items-center space-y-3'>
        <p className='text-sm text-white/60'>{t('update.downloading')}</p>
        <ProgressBar isIndeterminate aria-label={t('update.downloading')} className='w-full'>
          <ProgressBar.Track style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <ProgressBar.Fill style={{ backgroundColor: '#ffffff' }} />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </SplashScreen>
  )
}
