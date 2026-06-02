import type { InvokeKillProcess } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbPlayerPlay, TbPlayerStopFilled } from 'react-icons/tb'
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
        sidebarCollapsed ? 'w-calc-collapsed' : 'w-calc',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      <div className='px-6 pt-4 pb-3 select-none'>
        <div className='flex items-end justify-between'>
          <div>
            <p className='text-2xl font-black'>{t('idlingGames.title')}</p>
            <p className='text-xs text-altwhite/60 mt-0.5'>{t('idlingGames.subtitle')}</p>
          </div>
          {idleGamesList?.length > 0 && (
            <Button
              size='sm'
              radius='full'
              className='font-semibold'
              color='danger'
              startContent={<TbPlayerStopFilled fontSize={16} />}
              onPress={handleStopAll}
            >
              {t('idlingGames.stopAll')}
            </Button>
          )}
        </div>
      </div>

      {idleGamesList?.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-3 text-altwhite/40'>
          <TbPlayerPlay size={48} />
          <p className='text-sm'>{t('idlingGames.subtitle')}</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
