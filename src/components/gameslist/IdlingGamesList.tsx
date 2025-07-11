import type { InvokeKillProcess } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, cn } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbPlayerStopFilled } from 'react-icons/tb'

import { useIdleContext } from '@/components/contexts/IdleContext'
import { useStateContext } from '@/components/contexts/StateContext'
import GameCard from '@/components/ui/GameCard'
import { logEvent } from '@/utils/tasks'
import { showDangerToast, showSuccessToast } from '@/utils/toasts'

export default function IdlingGamesList(): ReactElement {
  const { t } = useTranslation()
  const { idleGamesList, setIdleGamesList } = useIdleContext()
  const { sidebarCollapsed, transitionDuration, setIsCardFarming, setIsAchievementUnlocker } = useStateContext()

  const handleStopIdleAll = async (): Promise<void> => {
    try {
      const response = await invoke<InvokeKillProcess>('kill_all_steamutil_processes')
      if (response.success) {
        showSuccessToast(
          t('toast.stopIdleAll.success', {
            count: response?.killed_count,
          }),
        )
        setIdleGamesList([])
        setIsCardFarming(false)
        setIsAchievementUnlocker(false)
      } else {
        showDangerToast(t('toast.stopIdleAll.error'))
      }
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleStopIdleAll:', error)
      logEvent(`Error in (handleStopIdleAll): ${error}`)
    }
  }

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'min-width, max-width',
      }}
    >
      <div
        className={cn(
          'w-[calc(100vw-236px)] z-[50] pl-4 pt-2 rounded-tl-xl',
          idleGamesList?.length >= 21 ? 'pr-4' : 'pr-2',
        )}
      >
        <div className='flex justify-between items-center pb-3'>
          <div className='flex flex-col justify-center'>
            <p className='text-3xl font-black'>{t('idlingGames.title')}</p>
            <div className='flex gap-1'>
              <p className='text-xs text-altwhite my-2'>{t('idlingGames.subtitle')}</p>
            </div>

            {idleGamesList?.length > 0 && (
              <div className='flex items-center gap-2 mt-1'>
                <Button
                  radius='full'
                  className='font-bold'
                  color='danger'
                  isDisabled={idleGamesList?.length === 0}
                  startContent={<TbPlayerStopFilled fontSize={20} />}
                  onPress={handleStopIdleAll}
                >
                  {t('idlingGames.stopAll')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 pt-2'>
        {idleGamesList && idleGamesList.map(item => <GameCard key={item.appid} item={item} />)}
      </div>
    </div>
  )
}
