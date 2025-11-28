import type { Achievement, Game, InvokeAchievementData } from '@/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, Checkbox, cn, Input, Spinner } from '@heroui/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FaCheck, FaPlus } from 'react-icons/fa6'
import { GoGrabber } from 'react-icons/go'

import CustomModal from '@/components/ui/CustomModal'
import WebviewWindow from '@/components/ui/WebviewWindow'
import { checkSteamStatus, logEvent } from '@/utils/tasks'
import { showAccountMismatchToast, showDangerToast } from '@/utils/toasts'

interface SortableAchievementProps {
  item: Game
  achievement: Achievement
  index: number
}

const SortableAchievement = memo(function SortableAchievement({
  item,
  achievement,
  index,
  onToggleSkip,
  onSetDelay,
}: SortableAchievementProps & {
  onToggleSkip: (name: string) => void
  onSetDelay: (name: string, value: number | null) => void
}): ReactElement {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: achievement.name })

  const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
  const icon = achievement.achieved
    ? `${iconUrl}${item.appid}/${achievement.iconNormal}`
    : `${iconUrl}${item.appid}/${achievement.iconLocked}`

  const [showDelayInput, setShowDelayInput] = useState(false)
  const [delayValue, setDelayValue] = useState<number | ''>(
    achievement.delayNextUnlock !== undefined ? achievement.delayNextUnlock : '',
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDelayValue(achievement.delayNextUnlock !== undefined ? achievement.delayNextUnlock : '')
  }, [achievement.delayNextUnlock])

  useEffect(() => {
    if (showDelayInput && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [showDelayInput])

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value
    if (val === '') {
      setDelayValue('')
    } else {
      const num = Math.max(0, Number(val))
      setDelayValue(num)
    }
  }

  const handleShowInput = (): void => setShowDelayInput(true)

  const handleClearInput = (): void => {
    setShowDelayInput(false)
    setDelayValue('')
    onSetDelay(achievement.name, null)
  }

  const handleInputBlur = (): void => {
    setShowDelayInput(false)
    if (delayValue === '' || delayValue === 0) {
      onSetDelay(achievement.name, null)
    } else {
      onSetDelay(achievement.name, Number(delayValue))
    }
  }

  return (
    <div className='grid grid-cols-[40px_1fr] gap-2 items-center duration-150'>
      <span className='text-lg font-bold text-altwhite text-center select-none'>{index + 1}</span>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={cn(
          'flex items-center gap-3 p-2 bg-card hover:bg-sidebar/70 rounded-lg',
          'group min-w-[98%] max-w-[98%]',
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

          <div className=''>
            {!showDelayInput && (
              <Button
                size='sm'
                className='text-xs max-h-5 bg-transparent p-0 cursor-pointer hover:opacity-80 duration-150'
                type='button'
                onPress={handleShowInput}
                onPointerDown={e => e.stopPropagation()}
              >
                {delayValue !== '' && delayValue !== 0 ? (
                  <p className='flex items-center text-green-400'>
                    <FaCheck className='inline-block mr-1' />
                    {t('customLists.achievementUnlocker.editDelay', { minutes: delayValue })}
                  </p>
                ) : (
                  <p className='flex items-center text-blue-400'>
                    <FaPlus className='inline-block mr-1' />
                    {t('customLists.achievementUnlocker.addDelay')}
                  </p>
                )}
              </Button>
            )}
            {showDelayInput && (
              <div className='flex items-center gap-2 mt-1'>
                <Input
                  ref={inputRef}
                  type='number'
                  min={0}
                  className='w-16 text-xs'
                  value={delayValue.toString() || '0'}
                  onChange={handleDelayChange}
                  size='sm'
                  onPointerDown={e => e.stopPropagation()}
                  onBlur={handleInputBlur}
                />
                <span className='text-xs text-gray-400'>{t('common.minutes')}</span>
                <Button
                  size='sm'
                  color='danger'
                  variant='light'
                  radius='full'
                  className='font-semibold'
                  onPress={handleClearInput}
                  onMouseDown={handleClearInput}
                  onPointerDown={e => e.stopPropagation()}
                >
                  {t('common.clear')}
                </Button>
              </div>
            )}
          </div>
        </div>
        <span
          {...listeners}
          {...attributes}
          className='cursor-grab active:cursor-grabbing'
          style={{ touchAction: 'none' }}
        >
          <GoGrabber size={30} className='text-altwhite hover:scale-115 hover:text-white duration-150' />
        </span>
      </div>
    </div>
  )
})

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
  const userSummary = useUserStore(state => state.userSummary)
  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [originalAchievements, setOriginalAchievements] = useState<Achievement[]>([])

  const handleDragEnd = useCallback((event: DragEndEvent): void => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setAchievements(items => {
        const oldIndex = items.findIndex(item => item.name === active.id)
        const newIndex = items.findIndex(item => item.name === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleToggleSkip = useCallback((achievementName: string): void => {
    setAchievements(items =>
      items.map(achievement =>
        achievement.name === achievementName ? { ...achievement, skip: achievement.skip !== true } : achievement,
      ),
    )
  }, [])

  const handleSetDelay = useCallback((achievementName: string, value: number | null): void => {
    setAchievements(items =>
      items.map(achievement =>
        achievement.name === achievementName
          ? value === null
            ? (() => {
                const { delayNextUnlock, ...rest } = achievement
                return rest
              })()
            : { ...achievement, delayNextUnlock: value }
          : achievement,
      ),
    )
  }, [])

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
        setOriginalAchievements([])

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
          // Save the default order (from achievementData) for reset
          setOriginalAchievements(
            achievementData.achievement_data.achievements.map(a => ({
              ...a,
              skip: undefined,
              delayNextUnlock: undefined,
            })),
          )
          setIsLoading(false)
          return
        }

        // Otherwise use achievement data directly
        if (achievementData?.achievement_data?.achievements) {
          if (achievementData.achievement_data.achievements.length > 0) {
            setAchievements(achievementData.achievement_data.achievements)
            setOriginalAchievements(
              achievementData.achievement_data.achievements.map(a => ({
                ...a,
                skip: undefined,
                delayNextUnlock: undefined,
              })),
            )
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

  const achievementList = useMemo(
    () => (
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
                onSetDelay={handleSetDelay}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    ),
    [achievements, handleDragEnd, handleToggleSkip, handleSetDelay, item, sensors],
  )

  // Reset handler: restore original order and clear skips/delays
  const handleReset = useCallback(() => {
    setAchievements(
      originalAchievements.map(a => ({
        ...a,
        skip: undefined,
        delayNextUnlock: undefined,
      })),
    )
  }, [originalAchievements])

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        body: '!p-0 !max-h-[60vh] !min-h-[60vh]',
        base: 'max-w-xl bg-base/85 backdrop-blur-sm',
      }}
      title={
        <div className='flex justify-between items-center'>
          <p className='truncate'>{item.name}</p>
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
              <div className='grid grid-cols-[40px_1fr] gap-2 items-center p-2 mb-2 border-b border-border sticky top-0 bg-sidebar z-50'>
                <span className='text-sm font-semibold text-content select-none text-center w-[26px]'>#</span>
                <div className='flex items-center gap-3 pl-0'>
                  <span className='text-sm font-semibold text-content text-center w-[26px]'>
                    {t('achievementManager.achievements.unlock')}
                  </span>
                  <span className='text-sm font-semibold text-content flex-1 ml-8'>
                    {t('achievementManager.achievements.title')}
                  </span>
                </div>
              </div>
              {achievementList}
            </>
          )}
        </div>
      }
      buttons={
        <>
          <WebviewWindow href='https://steamgameidler.com/docs/features/achievement-unlocker#custom-order--unlock-delay'>
            <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded-lg'>{t('setup.help')}</p>
          </WebviewWindow>
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
          <Button
            size='sm'
            color='danger'
            variant='light'
            radius='full'
            className='font-semibold'
            onPress={handleReset}
          >
            {t('achievementManager.statistics.resetAll')}
          </Button>
          <Button size='sm' className='bg-btn-secondary text-btn-text font-bold' radius='full' onPress={handleSave}>
            {t('common.save')}
          </Button>
        </>
      }
    />
  )
}
