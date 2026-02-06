import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCircleArrowDown } from 'react-icons/tb'
import { Spinner } from '@heroui/react'
import { CustomTooltip } from '@/shared/ui'
import { logEvent, showDangerToast } from '@/shared/utils'

export const UpdateButton = () => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async () => {
    try {
      setIsLoading(true)
      const update = await check()
      if (update) {
        localStorage.setItem('hasUpdated', 'true')
        await invoke('kill_all_steamutil_processes')
        await update.downloadAndInstall()
        await relaunch()
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      setIsLoading(false)
      showDangerToast(t('toast.checkUpdate.error'))
      console.error('Error in (handleUpdate):', error)
      logEvent(`Error in (handleUpdate): ${error}`)
    }
  }

  return (
    <div>
      {isLoading ? (
        <div className='flex items-center p-2 rounded-full'>
          <Spinner size='sm' variant='simple' />
        </div>
      ) : (
        <CustomTooltip content='Update Ready!'>
          <div className='flex justify-center items-center cursor-pointer' onClick={handleUpdate}>
            <div className='flex items-center px-1 py-1.5 text-success hover:text-success/80 duration-150'>
              <TbCircleArrowDown fontSize={20} />
            </div>
          </div>
        </CustomTooltip>
      )}
    </div>
  )
}
