import { useTranslation } from 'react-i18next'
import { Button, ProgressBar } from '@heroui/react'
import { SplashScreen } from '@/shared/components/SplashScreen'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { dismissFailedUpdate, retryUpdate } from '@/shared/utils/update'

// In-app-update splash screen - shown for the whole duration of `performUpdate` (see
// src/shared/utils/update.ts), driven by `updateStore.isUpdating`. Covers every path that sets it:
// the silent auto-install (a major update, or the very first check since app start - see
// useCheckForUpdates), the opt-in UpdateButton/menu/version-policy installs, and a tray-started
// install. No fade-out lifecycle like FullscreenLoader needs - it ends in either a `relaunch()`
// (the whole window closes) or the user leaving the error state below.
//
// A failed attempt (check error, stalled download, install error) doesn't close the screen on its
// own: it shows what happened and lets the user retry or carry on with the current version. Before
// this, a download on a silently-dropped connection never failed at all and left the user on an
// endless progress bar with no way out but closing the app.
//
// `ProgressBar` renders indeterminate until the download reports its size, then fills with real
// progress. Track/fill colors are forced to white via inline `style` (not className) since
// HeroUI's default color tokens aren't guaranteed to resolve to pure white against this splash
// screen's black backdrop.
export const UpdateLoader = () => {
  const { t } = useTranslation()
  const updateFailed = useUpdateStore(state => state.updateFailed)
  const downloadProgress = useUpdateStore(state => state.downloadProgress)

  if (updateFailed) {
    return (
      <SplashScreen>
        <div className='flex max-w-md flex-col items-center gap-4 px-6 text-center'>
          <p role='alert' className='text-sm text-white/80'>
            {t('update.failed')}
          </p>
          <div className='flex flex-wrap items-center justify-center gap-2'>
            <Button variant='secondary' onPress={dismissFailedUpdate}>
              {t('update.continueWithoutUpdating')}
            </Button>
            <Button onPress={retryUpdate}>{t('common.actions.tryAgain')}</Button>
          </div>
        </div>
      </SplashScreen>
    )
  }

  const isIndeterminate = downloadProgress === null

  return (
    <SplashScreen>
      <div className='flex w-64 flex-col items-center space-y-3'>
        <p className='text-sm text-white/60'>{t('update.downloading')}</p>
        <ProgressBar
          isIndeterminate={isIndeterminate}
          value={isIndeterminate ? undefined : Math.round(downloadProgress * 100)}
          aria-label={t('update.downloading')}
          className='w-full'
        >
          <ProgressBar.Track style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <ProgressBar.Fill style={{ backgroundColor: '#ffffff' }} />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </SplashScreen>
  )
}
