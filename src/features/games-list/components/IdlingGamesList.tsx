import type { InvokeKillProcess } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbPlayerStopFilled } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GameCard } from '@/shared/components/GameCard'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useSessionStore, useUiStore } from '@/shared/stores'

function useColumnCount() {
  const [count, setCount] = useState(5)
  const update = useCallback(() => {
    if (window.innerWidth >= 3200) setCount(12)
    else if (window.innerWidth >= 2300) setCount(10)
    else if (window.innerWidth >= 2000) setCount(8)
    else if (window.innerWidth >= 1500) setCount(7)
    else setCount(5)
  }, [])
  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])
  return count
}

export function IdlingGamesList() {
  const { t } = useTranslation()
  const idleGamesList = useSessionStore(s => s.idleGamesList)
  const setIdleGamesList = useSessionStore(s => s.setIdleGamesList)
  const setIsCardFarming = useSessionStore(s => s.setIsCardFarming)
  const setIsAchievementUnlocker = useSessionStore(s => s.setIsAchievementUnlocker)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const columnCount = useColumnCount()

  const handleStopAll = async () => {
    try {
      const res = await invoke<InvokeKillProcess>('kill_all_steamutil_processes')
      if (res.success) {
        toast.success(t('toast.stopIdleAll.success', { count: res?.killed_count }))
        setIdleGamesList([])
        setIsCardFarming(false)
        setIsAchievementUnlocker(false)
      } else {
        toast.danger(t('toast.stopIdleAll.error'))
      }
    } catch (error) {
      toast.danger(t('common.error'))
      console.error('Error in handleStopAll:', error)
      await logEvent(`Error in (handleStopIdleAll): ${error}`)
    }
  }

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-12 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{ transitionDuration, transitionProperty: 'min-width, max-width' }}
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
                  onPress={handleStopAll}
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
        {idleGamesList?.map(item => (
          <GameCard key={item.appid} item={item} />
        ))}
      </div>
    </div>
  )
}
