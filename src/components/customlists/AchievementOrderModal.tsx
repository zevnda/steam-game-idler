import type { Achievement, Game, InvokeAchievementData } from '@/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, Checkbox, cn, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { useUserContext } from '@/components/contexts/UserContext'
import CustomModal from '@/components/ui/CustomModal'
import { checkSteamStatus, logEvent } from '@/utils/tasks'
import { showAccountMismatchToast, showDangerToast } from '@/utils/toasts'

interface SortableAchievementProps {
  item: Game
  achievement: Achievement
  index: number
}

function SortableAchievement({
  item,
  achievement,
  index,
  onToggleSkip,
}: SortableAchievementProps & { onToggleSkip: (name: string) => void }): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: achievement.name })

  const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
  const icon = achievement.achieved
    ? `${iconUrl}${item.appid}/${achievement.iconNormal}`
    : `${iconUrl}${item.appid}/${achievement.iconLocked}`

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='grid grid-cols-[40px_1fr] gap-2 items-center'>
      <span className='text-lg font-bold text-altwhite text-center select-none'>{index + 1}</span>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'flex items-center gap-3 p-2 bg-card hover:bg-card/80 rounded-lg cursor-grab',
          'active:cursor-grabbing hover:bg-inputhover group min-w-[98%] max-w-[98%]',
          achievement.skip === true && 'opacity-40',
        )}
      >
        <div className='flex items-center justify-center w-[26px]'>
          <Checkbox
            isSelected={achievement.skip !== true}
            onValueChange={() => onToggleSkip(achievement.name)}
            onClick={e => e.stopPropagation()}
            className='ml-3'
          />
        </div>
        <Image
          className='rounded-full ml-8 select-none'
          src={icon}
          width={32}
          height={32}
          alt={`${achievement.name} image`}
          priority
        />
        <div className='flex-1 min-w-0 select-none'>
          <p className='font-semibold truncate'>{achievement.name}</p>
          <p
            className={cn(
              'text-xs text-gray-400 truncate',
              achievement.hidden && 'blur-[3px] group-hover:blur-none transition-all duration-200',
            )}
          >
            {achievement.description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AchievementOrderModal({
  item,
  isOpen,
  onOpenChange,
}: {
  item: Game
  isOpen: boolean
  onOpenChange: () => void
}): ReactElement {
  const { t } = useTranslation()
  const { userSummary } = useUserContext()
  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setAchievements(items => {
        const oldIndex = items.findIndex(item => item.name === active.id)
        const newIndex = items.findIndex(item => item.name === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleToggleSkip = (achievementName: string): void => {
    setAchievements(items =>
      items.map(achievement =>
        achievement.name === achievementName ? { ...achievement, skip: achievement.skip !== true } : achievement,
      ),
    )
  }

  const handleSave = async (): Promise<void> => {
    try {
      await invoke('save_achievement_order', {
        steamId: userSummary?.steamId,
        appId: item.appid,
        achievementOrder: {
          achievements,
        },
      })
      onOpenChange()
    } catch (error) {
      console.error('Error saving achievement order:', error)
      showDangerToast(t('toast.achievementOrder.error'))
    }
  }

  useEffect(() => {
    const getAchievementData = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setAchievements([])
        // Make sure Steam client is running
        const isSteamRunning = checkSteamStatus(true)
        if (!isSteamRunning) return setIsLoading(false)

        // First try to get custom achievement order
        const customOrder = await invoke<{ achievement_order: { achievements: Achievement[] } | null }>(
          'get_achievement_order',
          {
            steamId: userSummary?.steamId,
            appId: item.appid,
          },
        )

        // Fetch achievement data to sync states
        const response = await invoke<InvokeAchievementData | string>('get_achievement_data', {
          steamId: userSummary?.steamId,
          appId: item.appid,
          refetch: false,
        })

        // Handle case where Steam API initialization failed
        if (typeof response === 'string' && response.includes('Failed to initialize Steam API')) {
          setIsLoading(false)
          showAccountMismatchToast('danger')
          logEvent(`Error in (getAchievementData): ${response}`)
          return
        }

        const achievementData = response as InvokeAchievementData

        // If we have a custom order, update its achievement states and use it
        if (customOrder.achievement_order?.achievements && achievementData?.achievement_data?.achievements) {
          const updatedAchievements = customOrder.achievement_order.achievements.map(achievement => {
            const currentState = achievementData.achievement_data.achievements.find(a => a.name === achievement.name)
            return currentState ? { ...achievement, achieved: currentState.achieved } : achievement
          })
          setAchievements(updatedAchievements)
          setIsLoading(false)
          return
        }

        // Otherwise use achievement data directly
        if (achievementData?.achievement_data?.achievements) {
          if (achievementData.achievement_data.achievements.length > 0) {
            setAchievements(achievementData.achievement_data.achievements)
          }
        }

        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        showDangerToast(t('toast.achievementData.error'))
        console.error('Error in (getAchievementData):', error)
        logEvent(`Error in (getAchievementData): ${error}`)
      }
    }

    if (isOpen && item.appid) {
      getAchievementData()
    }
  }, [t, isOpen, item.appid, userSummary?.steamId])

  const sensors = useSensors(useSensor(PointerSensor))

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        body: '!p-0 !max-h-[60vh] !min-h-[60vh]',
        base: 'max-w-xl',
      }}
      title={
        <div>
          <p className='truncate'>{item.name}</p>
          <p className='text-xs font-normal mt-2'>{t('customLists.achievementUnlocker.customOrderDesc')}</p>
        </div>
      }
      body={
        <div className='overflow-x-hidden overflow-y-auto relative '>
          {isLoading ? (
            <div className='flex justify-center items-center w-full p-4'>
              <Spinner />
            </div>
          ) : achievements.length === 0 ? (
            <div className='flex justify-center items-center w-full p-4'>
              <p className='text-center text-content'>{t('achievementManager.achievements.empty')}</p>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-[40px_1fr] gap-2 items-center p-2 mb-2 border-b border-border sticky top-0 bg-[#18181b] z-50'>
                <span className='text-sm font-semibold text-content select-none text-center w-[26px]'>#</span>
                <div className='flex items-center gap-3 pl-0'>
                  <span className='text-sm font-semibold text-content text-center w-[26px]'>Unlock</span>
                  <span className='text-sm font-semibold text-content flex-1 ml-8'>Achievement</span>
                </div>
              </div>
              <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                <SortableContext items={achievements.map(a => a.name)}>
                  <div className='grid grid-cols-1 gap-1'>
                    {achievements.map((achievement, index) => (
                      <SortableAchievement
                        item={item}
                        key={achievement.name}
                        achievement={achievement}
                        index={index}
                        onToggleSkip={handleToggleSkip}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      }
      buttons={
        <>
          <Button
            size='sm'
            color='danger'
            variant='light'
            radius='full'
            className='font-semibold'
            onPress={onOpenChange}
          >
            {t('common.cancel')}
          </Button>
          <Button size='sm' className='bg-btn-secondary text-btn-text font-bold' radius='full' onPress={handleSave}>
            {t('common.save')}
          </Button>
        </>
      }
    />
  )
}
