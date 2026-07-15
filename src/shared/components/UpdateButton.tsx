import { check } from '@tauri-apps/plugin-updater'
import { useState } from 'react'
import { TbCircleArrowDown } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { fetchLatest, performUpdate } from '@/shared/utils/update'

/**
 * Opt-in update button for the non-major/non-first-check case (see `useCheckForUpdates`) - the
 * user clicks to download and install rather than it happening silently.
 *
 * Mounted twice, both reading the same `updateStore.updateAvailable`: pre-sign-in in
 * `src/pages/index.tsx`, and for signed-in users in `DashboardShell` - both positioned below the
 * global `Titlebar` at the same fixed top-right spot, so a user parked on `/dashboard/*` for a
 * later non-major update isn't stranded without a way to trigger it.
 */
export const UpdateButton = () => {
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
    <Button
      isIconOnly
      aria-label='Update ready'
      isPending={isChecking}
      variant='secondary'
      onPress={handleUpdate}
    >
      <TbCircleArrowDown fontSize={20} />
    </Button>
  )
}
