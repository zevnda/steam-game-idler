import type { Achievement, InvokeAchievementData } from '@/shared/types'
import type { DragEndEvent } from '@dnd-kit/core'
import { invoke } from '@tauri-apps/api/core'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoGrabber } from 'react-icons/go'
import { TbClock, TbX } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Checkbox, cn, Input, Spinner } from '@heroui/react'
import Image from 'next/image'
import { ExtLink, showAccountMismatchToast, showDangerToast } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus, logEvent } from '@/shared/utils'

interface SortableAchievementProps {
  appid: number
  achievement: Achievement
  index: number
  style?: React.CSSProperties
  onToggleSkip: (name: string) => void
  onSetDelay: (name: string, value: number | null) => void
}

const SortableAchievement = memo(function SortableAchievement({
  appid,
  achievement,
  index,
  style,
  onToggleSkip,
  onSetDelay,
}: SortableAchievementProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: achievement.name,
  })

  const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
  const icon = achievement.achieved
    ? `${iconUrl}${appid}/${achievement.iconNormal}`
    : `${iconUrl}${appid}/${achievement.iconLocked}`

  const [delayValue, setDelayValue] = useState<number | ''>(
    achievement.delayNextUnlock !== undefined ? achievement.delayNextUnlock : '',
  )

  useEffect(() => {
    setDelayValue(achievement.delayNextUnlock !== undefined ? achievement.delayNextUnlock : '')
  }, [achievement.delayNextUnlock])

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      setDelayValue('')
    } else {
      setDelayValue(Math.max(0, Number(val)))
    }
  }

  const handleInputBlur = () => {
    if (delayValue === '' || delayValue === 0) {
      onSetDelay(achievement.name, null)
    } else {
      onSetDelay(achievement.name, Number(delayValue))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleInputBlur()
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, ...style }}
      className={cn(
        'grid grid-cols-[28px_40px_1fr_auto_36px] items-center gap-3 px-3 py-2.5',
        'bg-card hover:bg-sidebar/60 group duration-150',
        (achievement.skip === true || achievement.achieved) && 'opacity-40',
      )}
    >
      {/* Checkbox */}
      <div className='flex items-center justify-center'>
        <Checkbox
          isSelected={!achievement.achieved && achievement.skip !== true}
          isDisabled={achievement.achieved}
          onValueChange={() => onToggleSkip(achievement.name)}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Icon */}
      <Image
        className='rounded-full select-none'
        src={icon}
        width={36}
        height={36}
        alt={`${achievement.name} image`}
        priority
      />

      {/* Name + description */}
      <div className='min-w-0 select-none'>
        <div className='flex items-baseline gap-2 min-w-0'>
          <p className='font-semibold truncate'>{achievement.name}</p>
          {achievement.percent !== undefined && achievement.percent > 0 && (
            <span className='text-xs text-altwhite/60 shrink-0'>
              {achievement.percent.toFixed(1)}%
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-xs text-altwhite truncate',
            achievement.hidden && 'blur-[3px] group-hover:blur-none transition-all duration-200',
          )}
        >
          {achievement.description}
        </p>
      </div>

      {/* Inline delay input */}
      <div
        className='flex items-center gap-1.5 shrink-0 select-none'
        onPointerDown={e => e.stopPropagation()}
      >
        <Input
          type='number'
          min={0}
          step={0.1}
          placeholder='0'
          isDisabled={achievement.achieved}
          className='w-16'
          value={delayValue.toString()}
          onChange={handleDelayChange}
          size='sm'
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          classNames={{
            inputWrapper: cn(
              'bg-input data-[hover=true]:!bg-inputhover',
              'group-data-[focus-within=true]:!bg-inputhover',
              'group-data-[focus-visible=true]:ring-transparent',
              'group-data-[focus-visible=true]:ring-offset-transparent',
            ),
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
        />
        <span className='text-xs text-altwhite'>{t('common.minutes')}</span>
      </div>

      {/* Drag handle */}
      <span
        {...listeners}
        {...attributes}
        className='cursor-grab active:cursor-grabbing justify-self-end'
        style={{ touchAction: 'none' }}
      >
        <GoGrabber
          size={28}
          className='text-altwhite hover:scale-115 hover:text-white duration-150'
        />
      </span>
    </div>
  )
})

interface SortableRowData {
  appid: number
  achievements: Achievement[]
  onToggleSkip: (name: string) => void
  onSetDelay: (name: string, value: number | null) => void
}

const SortableRow = memo(function SortableRow({
  index,
  style,
  data,
}: {
  index: number
  style: React.CSSProperties
  data: SortableRowData
}) {
  const achievement = data.achievements[index]
  if (!achievement) return null
  return (
    <SortableAchievement
      style={style}
      appid={data.appid}
      achievement={achievement}
      index={index}
      onToggleSkip={data.onToggleSkip}
      onSetDelay={data.onSetDelay}
    />
  )
})

export const AchievementOrderPage = () => {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const achievementOrderGame = useStateStore(state => state.achievementOrderGame)
  const setShowAchievementOrder = useStateStore(state => state.setShowAchievementOrder)

  const item = achievementOrderGame!

  const [windowInnerHeight, setWindowInnerHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800,
  )

  useEffect(() => {
    const handleResize = () => setWindowInnerHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [originalAchievements, setOriginalAchievements] = useState<Achievement[]>([])
  const [delayBeforeFirstUnlock, setDelayBeforeFirstUnlock] = useState<number | ''>('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setAchievements(items => {
        const oldIndex = items.findIndex(a => a.name === active.id)
        const newIndex = items.findIndex(a => a.name === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleToggleSkip = useCallback((achievementName: string) => {
    setAchievements(items =>
      items.map(a => (a.name === achievementName ? { ...a, skip: a.skip !== true } : a)),
    )
  }, [])

  const handleSetDelay = useCallback((achievementName: string, value: number | null) => {
    setAchievements(items =>
      items.map(a => {
        if (a.name !== achievementName) return a
        if (value === null) {
          const { delayNextUnlock, ...rest } = a
          return rest
        }
        return { ...a, delayNextUnlock: value }
      }),
    )
  }, [])

  const handleSave = async () => {
    try {
      await invoke('save_achievement_order', {
        steamId: userSummary?.steamId,
        appId: item.appid,
        achievementOrder: {
          achievements,
          ...(typeof delayBeforeFirstUnlock === 'number' && delayBeforeFirstUnlock > 0
            ? { delayBeforeFirstUnlock }
            : {}),
        },
      })
      setShowAchievementOrder(false)
    } catch (error) {
      console.error('Error saving achievement order:', error)
      showDangerToast(t('toast.achievementOrder.error'))
    }
  }

  const handleReset = useCallback(() => {
    setAchievements(
      originalAchievements.map(a => ({ ...a, skip: undefined, delayNextUnlock: undefined })),
    )
    setDelayBeforeFirstUnlock('')
  }, [originalAchievements])

  useEffect(() => {
    const getAchievementData = async () => {
      try {
        setIsLoading(true)
        setAchievements([])
        setOriginalAchievements([])

        const isSteamRunning = await checkSteamStatus(true)
        if (!isSteamRunning) return setIsLoading(false)

        const customOrder = await invoke<{
          achievement_order: {
            achievements: Achievement[]
            delayBeforeFirstUnlock?: number
          } | null
        }>('get_achievement_order', {
          steamId: userSummary?.steamId,
          appId: item.appid,
        })

        const response = await invoke<InvokeAchievementData | string>('get_achievement_data', {
          steamId: userSummary?.steamId,
          appId: item.appid,
          refetch: false,
        })

        if (typeof response === 'string' && response.includes('Failed to initialize Steam API')) {
          setIsLoading(false)
          showAccountMismatchToast('danger')
          logEvent(`Error in (getAchievementData): ${response}`)
          return
        }

        const achievementData = response as InvokeAchievementData

        if (
          customOrder.achievement_order?.achievements &&
          achievementData?.achievement_data?.achievements
        ) {
          const updatedAchievements = customOrder.achievement_order.achievements.map(a => {
            const currentState = achievementData.achievement_data.achievements.find(
              b => b.name === a.name,
            )
            return currentState ? { ...a, achieved: currentState.achieved } : a
          })
          setAchievements(updatedAchievements)
          setDelayBeforeFirstUnlock(customOrder.achievement_order.delayBeforeFirstUnlock ?? '')
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

        if (achievementData?.achievement_data?.achievements?.length > 0) {
          setAchievements(achievementData.achievement_data.achievements)
          setOriginalAchievements(
            achievementData.achievement_data.achievements.map(a => ({
              ...a,
              skip: undefined,
              delayNextUnlock: undefined,
            })),
          )
        }

        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        showDangerToast(t('toast.achievementData.error'))
        console.error('Error in (getAchievementData):', error)
        logEvent(`Error in (getAchievementData): ${error}`)
      }
    }

    if (item?.appid) {
      getAchievementData()
    }
  }, [item?.appid, userSummary?.steamId, t])

  const sensors = useSensors(useSensor(PointerSensor))

  const unlockedAchievements = achievements.filter(a => !a.achieved)
  const allSelected =
    unlockedAchievements.length > 0 && unlockedAchievements.every(a => a.skip !== true)
  const isIndeterminate = !allSelected && unlockedAchievements.some(a => a.skip !== true)

  const handleToggleAll = useCallback(() => {
    setAchievements(items =>
      items.map(a => (a.achieved ? a : { ...a, skip: allSelected ? true : undefined })),
    )
  }, [allSelected])

  const listOuterRef = useRef<HTMLDivElement>(null)

  const achievementList = useMemo(() => {
    const rowData: SortableRowData = {
      appid: item.appid,
      achievements,
      onToggleSkip: handleToggleSkip,
      onSetDelay: handleSetDelay,
    }
    return (
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
        autoScroll={{ canScroll: element => element === listOuterRef.current }}
      >
        <SortableContext items={achievements.map(a => a.name)}>
          <List
            outerRef={listOuterRef}
            height={windowInnerHeight - 245}
            itemCount={achievements.length}
            itemSize={60}
            width='100%'
            itemData={rowData}
          >
            {SortableRow}
          </List>
        </SortableContext>
      </DndContext>
    )
  }, [
    achievements,
    handleDragEnd,
    handleToggleSkip,
    handleSetDelay,
    item.appid,
    sensors,
    windowInnerHeight,
  ])

  return (
    <div
      className={cn(
        'overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      {/* Background hero image */}
      <Image
        src={
          fallbackImage || `https://cdn.steamstatic.com/steam/apps/${item.appid}/library_hero.jpg`
        }
        className={cn('absolute top-0 left-0 w-full', !imageLoaded && 'hidden')}
        alt='background'
        width={1920}
        height={1080}
        priority
        onLoad={() => setImageLoaded(true)}
        onError={() =>
          setFallbackImage(`https://cdn.steamstatic.com/steam/apps/${item.appid}/header.jpg`)
        }
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 70%)',
        }}
      />
      {imageLoaded && <div className='absolute top-0 left-0 w-full h-screen bg-base/70' />}

      <div className='relative p-4'>
        {/* Page header */}
        <div className='relative flex justify-between items-center px-8'>
          <div className='flex items-center gap-3'>
            <Button
              isIconOnly
              radius='full'
              className='bg-btn-achievement-header hover:bg-btn-achievement-header-hover text-btn-alt'
              onPress={() => setShowAchievementOrder(false)}
            >
              <TbX />
            </Button>

            <div className='w-[320px]'>
              <p className='text-3xl font-black truncate'>{item.name}</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <ExtLink href='https://steamgameidler.com/docs/features/achievement-unlocker#custom-order--unlock-delay'>
              <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded-lg'>
                {t('common.needHelp')}
              </p>
            </ExtLink>
            <Button
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={handleReset}
            >
              {t('achievementManager.statistics.resetAll')}
            </Button>
            <Button
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={handleSave}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className='ml-8 mr-6 mt-6 flex flex-col gap-4 pb-8'>
          {/* Achievement list card */}
          <div className='bg-base/50 rounded-xl border border-border/40 overflow-hidden'>
            {isLoading ? (
              <div className='flex justify-center items-center p-12'>
                <Spinner />
              </div>
            ) : achievements.length === 0 ? (
              <div className='flex justify-center items-center p-12'>
                <p className='text-center text-content'>
                  {t('achievementManager.achievements.empty')}
                </p>
              </div>
            ) : (
              <>
                {/* Sticky column header */}
                <div className='grid grid-cols-[28px_40px_1fr_auto_36px] items-center gap-3 px-3 py-2 border-b border-border/40 sticky top-0 bg-sidebar z-10'>
                  <div className='flex items-center justify-center'>
                    <Checkbox
                      isSelected={allSelected}
                      isIndeterminate={isIndeterminate}
                      onValueChange={handleToggleAll}
                    />
                  </div>
                  <span />
                  <span className='text-sm font-semibold text-content'>
                    {t('achievementManager.achievements.title')}
                  </span>
                  <span className='text-sm font-semibold text-content'>
                    {t('customLists.achievementUnlocker.delay')}
                  </span>
                  <span />
                </div>

                {/* Initial delay */}
                <div className='grid grid-cols-[28px_40px_1fr_auto_36px] items-center gap-3 px-3 py-2.5 bg-sidebar/60 border-b border-border/40'>
                  <span />
                  <div className='flex items-center justify-center'>
                    <TbClock size={22} className='text-altwhite' />
                  </div>
                  <div className='min-w-0 select-none'>
                    <p className='font-semibold text-sm truncate'>
                      {t('customLists.achievementUnlocker.delayBeforeFirstUnlock')}
                    </p>
                    <p className='text-xs text-altwhite truncate'>
                      {t('customLists.achievementUnlocker.delayBeforeFirstUnlockDesc')}
                    </p>
                  </div>
                  <div
                    className='flex items-center gap-1.5 shrink-0 select-none'
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <Input
                      type='number'
                      size='sm'
                      min={0}
                      step={0.1}
                      placeholder='0'
                      className='w-16 mr-1'
                      value={delayBeforeFirstUnlock.toString()}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '') {
                          setDelayBeforeFirstUnlock('')
                        } else {
                          setDelayBeforeFirstUnlock(Math.max(0, Number(val)))
                        }
                      }}
                      classNames={{
                        inputWrapper: cn(
                          'bg-input data-[hover=true]:!bg-inputhover',
                          'group-data-[focus-within=true]:!bg-inputhover',
                          'group-data-[focus-visible=true]:ring-transparent',
                          'group-data-[focus-visible=true]:ring-offset-transparent',
                        ),
                        input: ['!text-content placeholder:text-altwhite/50'],
                      }}
                    />
                    <span className='text-xs text-altwhite'>{t('common.minutes')}</span>
                  </div>
                  <span />
                </div>

                {/* List */}
                {achievementList}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
