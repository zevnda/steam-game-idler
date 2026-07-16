import { check } from '@tauri-apps/plugin-updater'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCircleArrowDown } from 'react-icons/tb'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { fetchLatest, performUpdate } from '@/shared/utils/update'

/**
 * Opt-in update button for the non-major/non-first-check case (see `useCheckForUpdates`) - the
 * user clicks to download and install rather than it happening silently.
 *
 * Mounted once, from `Titlebar` itself (left of `HelpDesk`) - `Titlebar` is global (mounted once
 * in `_app.tsx`, present on every screen including sign-in), so this single mount point covers
 * both the pre-sign-in and signed-in-dashboard cases `updateStore.updateAvailable` gates,
 * replacing what used to be two separate fixed-position mounts in `pages/index.tsx` and
 * `DashboardShell`. Not tier-gated, unlike `HelpDesk` - an available update is never a monetization
 * concern.
 */
export const UpdateButton = () => {
  const { t } = useTranslation()
  const setIsUpdating = useUpdateStore(state => state.setIsUpdating)
  // Local, not the store's `isUpdating` - covers only the brief `check()` round trip below.
  // `performUpdate` takes over from there, flipping the store's `isUpdating` to show
  // `UpdateLoader`, which unmounts this button almost immediately anyway.
  const [isChecking, setIsChecking] = useState(false)

  const handleUpdate = async () => {
    try {
      setIsChecking(true)
      const update = await check()
      if (!update) {
        setIsChecking(false)
        return
      }

      const latest = await fetchLatest()
      await performUpdate(update, { major: !!latest?.major, setIsUpdating })
    } catch (error) {
      setIsChecking(false)
      setIsUpdating(false)
      console.error('Error in (handleUpdate):', error)
      logFrontendWarn('UpdateButton', 'manual update check failed', { error: String(error) })
    }
  }

  return (
    <AppTooltip.Root delay={300}>
      <AppTooltip.Trigger>
        <button
          type='button'
          aria-label={t('titlebar.updateReady')}
          className='flex h-14 w-12 items-center justify-center text-accent outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50 cursor-pointer'
          disabled={isChecking}
          onClick={handleUpdate}
        >
          <TbCircleArrowDown fontSize={18} />
        </button>
      </AppTooltip.Trigger>
      <AppTooltip.Content placement='bottom'>{t('titlebar.updateReady')}</AppTooltip.Content>
    </AppTooltip.Root>
  )
}
