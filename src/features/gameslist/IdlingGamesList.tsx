import type { InvokeKillProcess } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbPlayerStopFilled } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { useIdleStore, useStateStore } from '@/shared/stores'
import { GameCard, showDangerToast, showSuccessToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const IdlingGamesList = () => {
  const { t } = useTranslation()
  const idleGamesList = useIdleStore(state => state.idleGamesList)
  const setIdleGamesList = useIdleStore(state => state.setIdleGamesList)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const setIsCardFarming = useStateStore(state => state.setIsCardFarming)
  const setIsAchievementUnlocker = useStateStore(state => state.setIsAchievementUnlocker)
  const [columnCount, setColumnCount] = useState(5)

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 3200) {
      setColumnCount(12)
    } else if (window.innerWidth >= 2300) {
      setColumnCount(10)
    } else if (window.innerWidth >= 2000) {
      setColumnCount(8)
    } else if (window.innerWidth >= 1500) {
      setColumnCount(7)
    } else {
      setColumnCount(5)
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const handleStopIdleAll = async () => {
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
      <div className={cn('w-[calc(100vw-236px)] z-50 pl-6 pt-2 rounded-tl-xl')}>
        <div className='flex justify-between items-center pb-3'>
          <div className='flex flex-col justify-center select-none'>
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

      <div
        className={cn(
          'grid gap-x-5 gap-y-4 px-6',
          columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5',
          columnCount === 8 ? 'grid-cols-8' : '',
          columnCount === 10 ? 'grid-cols-10' : '',
          columnCount === 12 ? 'grid-cols-12' : '',
        )}
      >
        {idleGamesList && idleGamesList.map(item => <GameCard key={item.appid} item={item} />)}
      </div>
    </div>
  )
}
