import type { Achievement, InvokeAchievementData } from '@/shared/types'
import type { DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { invoke } from '@tauri-apps/api/core'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoGrabber } from 'react-icons/go'
import { TbClock, TbX } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { ImportTimingsModal } from './ImportTimingsModal'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Checkbox, cn, Input, Spinner, useDisclosure } from '@heroui/react'
import Image from 'next/image'
import { OpenDocs } from '@/shared/components/OpenDocs'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus, hasGamerFeature } from '@/shared/utils'

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
  style,
  onToggleSkip,
  onSetDelay,
}: SortableAchievementProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: achievement.name,
  })
  const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
  const icon = achievement.achieved
    ? `${iconUrl}${appid}/${achievement.iconNormal}`
    : `${iconUrl}${appid}/${achievement.iconLocked}`
  const [delayValue, setDelayValue] = useState<number | ''>(achievement.delayNextUnlock ?? '')

  useEffect(() => {
    setDelayValue(achievement.delayNextUnlock ?? '')
  }, [achievement.delayNextUnlock])

  const handleBlur = () => {
    if (delayValue === '' || delayValue === 0) {
      onSetDelay(achievement.name, null)
    } else {
      onSetDelay(achievement.name, Number(delayValue))
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, ...style }}
      className={cn(
        'grid grid-cols-[28px_40px_1fr_auto_36px] items-center gap-3 px-3 py-2.5 bg-card hover:bg-sidebar/60 group duration-150',
        (achievement.skip === true || achievement.achieved) && 'opacity-40',
        isDragging && 'opacity-0',
      )}
    >
      <div className='flex items-center justify-center'>
        <Checkbox
          isSelected={!achievement.achieved && achievement.skip !== true}
          isDisabled={achievement.achieved}
          onValueChange={() => onToggleSkip(achievement.name)}
          onClick={e => e.stopPropagation()}
        />
      </div>
      <Image
        className='rounded-full select-none'
        src={icon}
        width={36}
        height={36}
        alt={achievement.name}
        priority
      />
      <div className='min-w-0 select-none'>
        <div className='flex items-baseline gap-2'>
          <p className='font-semibold truncate'>{achievement.name}</p>
          {achievement.percent > 0 && (
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
          className='w-24'
          value={delayValue.toString()}
          onChange={e => {
            const v = e.target.value
            setDelayValue(v === '' ? '' : Math.max(0, Number(v)))
          }}
          size='sm'
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === 'Enter') handleBlur()
          }}
          classNames={{
            inputWrapper: cn(
              'bg-input data-[hover=true]:!bg-inputhover group-data-[focus-within=true]:!bg-inputhover group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent',
            ),
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
        />
        <span className='text-xs text-altwhite'>{t('common.minutes')}</span>
      </div>
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

const SortableRow = memo(function SortableRow({
  index,
  style,
  data,
}: {
  index: number
  style: React.CSSProperties
  data: {
    appid: number
    achievements: Achievement[]
    onToggleSkip: (n: string) => void
    onSetDelay: (n: string, v: number | null) => void
  }
}) {
  const a = data.achievements[index]
  if (!a) return null
  return (
    <SortableAchievement
      style={style}
      appid={data.appid}
      achievement={a}
      index={index}
      onToggleSkip={data.onToggleSkip}
      onSetDelay={data.onSetDelay}
    />
  )
})

export function AchievementOrderPage() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const proTier = useUserStore(s => s.proTier)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const achievementOrderGame = useUiStore(s => s.achievementOrderGame)
  const setAchievementOrderGame = useUiStore(s => s.setAchievementOrderGame)
  const setProModalOpen = useUiStore(s => s.setProModalOpen)
  const setProModalRequiredTier = useUiStore(s => s.setProModalRequiredTier)
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onOpenChange: onImportOpenChange,
  } = useDisclosure()

  const item = achievementOrderGame!
  const [windowH, setWindowH] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)
  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [originalAchievements, setOriginalAchievements] = useState<Achievement[]>([])
  const [delayBeforeFirstUnlock, setDelayBeforeFirstUnlock] = useState<number | ''>('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const h = () => setWindowH(window.innerHeight)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const handleDragStart = useCallback((e: DragStartEvent) => setActiveId(e.active.id as string), [])
  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e
    if (over && active.id !== over.id) {
      setAchievements(items => {
        const oi = items.findIndex(a => a.name === active.id)
        const ni = items.findIndex(a => a.name === over.id)
        return arrayMove(items, oi, ni)
      })
    }
  }, [])
  const handleDragEnd = useCallback(() => setActiveId(null), [])
  const handleToggleSkip = useCallback(
    (name: string) =>
      setAchievements(items =>
        items.map(a => (a.name === name ? { ...a, skip: a.skip !== true } : a)),
      ),
    [],
  )
  const handleSetDelay = useCallback(
    (name: string, value: number | null) =>
      setAchievements(items =>
        items.map(a => {
          if (a.name !== name) return a
          if (value === null) {
            const { delayNextUnlock, ...rest } = a
            return rest
          }
          return { ...a, delayNextUnlock: value }
        }),
      ),
    [],
  )

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
      setAchievementOrderGame(null)
    } catch (error) {
      toast.danger(t('toast.achievementOrder.error'))
      console.error('Error saving achievement order:', error)
    }
  }

  const handleReset = useCallback(() => {
    setAchievements(
      [...originalAchievements]
        .sort((a, b) => (b.percent || 0) - (a.percent || 0))
        .map(a => ({ ...a, skip: undefined, delayNextUnlock: undefined })),
    )
    setDelayBeforeFirstUnlock('')
  }, [originalAchievements])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setAchievements([])
        setOriginalAchievements([])
        const running = await checkSteamStatus(true)
        if (!running) return setIsLoading(false)
        const [customOrder, response] = await Promise.all([
          invoke<{
            achievement_order: {
              achievements: Achievement[]
              delayBeforeFirstUnlock?: number
            } | null
          }>('get_achievement_order', { steamId: userSummary?.steamId, appId: item.appid }),
          invoke<InvokeAchievementData | string>('get_achievement_data', {
            steamId: userSummary?.steamId,
            appId: item.appid,
            refetch: false,
          }),
        ])
        if (typeof response === 'string' && response.includes('Failed to initialize Steam API')) {
          setIsLoading(false)
          toast.accountMismatch('danger')
          return
        }
        const data = response as InvokeAchievementData
        if (customOrder.achievement_order?.achievements && data?.achievement_data?.achievements) {
          const updated = customOrder.achievement_order.achievements.map(a => {
            const cur = data.achievement_data.achievements.find(b => b.name === a.name)
            return cur ? { ...a, achieved: cur.achieved } : a
          })
          setAchievements(updated)
          setDelayBeforeFirstUnlock(customOrder.achievement_order.delayBeforeFirstUnlock ?? '')
          setOriginalAchievements(
            data.achievement_data.achievements.map(a => ({
              ...a,
              skip: undefined,
              delayNextUnlock: undefined,
            })),
          )
        } else if (data?.achievement_data?.achievements?.length > 0) {
          const sorted = [...data.achievement_data.achievements].sort(
            (a, b) => (b.percent || 0) - (a.percent || 0),
          )
          setAchievements(sorted)
          setOriginalAchievements(
            data.achievement_data.achievements.map(a => ({
              ...a,
              skip: undefined,
              delayNextUnlock: undefined,
            })),
          )
        }
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        toast.danger(t('toast.achievementData.error'))
        await logEvent(`Error in (getAchievementData): ${error}`)
      }
    }
    if (item?.appid) load()
  }, [item?.appid, userSummary?.steamId, t])

  const sensors = useSensors(useSensor(PointerSensor))
  const unlocked = achievements.filter(a => !a.achieved)
  const allSelected = unlocked.length > 0 && unlocked.every(a => a.skip !== true)
  const isIndeterminate = !allSelected && unlocked.some(a => a.skip !== true)
  const handleToggleAll = useCallback(
    () =>
      setAchievements(items =>
        items.map(a => (a.achieved ? a : { ...a, skip: allSelected ? true : undefined })),
      ),
    [allSelected],
  )
  const listRef = useRef<HTMLDivElement>(null)
  const activeAchievement = useMemo(
    () => (activeId ? (achievements.find(a => a.name === activeId) ?? null) : null),
    [activeId, achievements],
  )
  const rowData = useMemo(
    () => ({
      appid: item.appid,
      achievements,
      onToggleSkip: handleToggleSkip,
      onSetDelay: handleSetDelay,
    }),
    [item.appid, achievements, handleToggleSkip, handleSetDelay],
  )

  return (
    <div
      className={cn(
        'overflow-y-auto overflow-x-hidden mt-12 ease-in-out',
        sidebarCollapsed ? 'w-calc-collapsed' : 'w-calc',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
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
        <div className='relative flex justify-between items-center px-8'>
          <div className='flex items-center gap-3'>
            <Button
              isIconOnly
              radius='full'
              className='bg-btn-achievement-header hover:bg-btn-achievement-header-hover text-btn-alt'
              onPress={() => setAchievementOrderGame(null)}
            >
              <TbX />
            </Button>
            <div className='w-[320px]'>
              <p className='text-3xl font-black truncate'>{item.name}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <OpenDocs
              path='/features/achievement-unlocker/custom-order-and-unlock-delay'
              content={t('common.needHelp')}
            />
            <Button
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={handleReset}
            >
              {t('achievementManager.statistics.resetAll')}
            </Button>
            <div
              onClick={() => {
                if (!hasGamerFeature(proTier)) {
                  setProModalRequiredTier('gamer')
                  setProModalOpen(true)
                }
              }}
            >
              <Button
                className='bg-btn-secondary text-btn-text font-semibold'
                radius='full'
                isDisabled={!hasGamerFeature(proTier)}
                onPress={onImportOpen}
              >
                {t('customLists.achievementUnlocker.importTimings.title')}
                {!hasGamerFeature(proTier) && (
                  <ProBadge className='scale-70 -mx-2' requiredTier='gamer' />
                )}
              </Button>
            </div>
            <Button
              className='bg-btn-secondary text-btn-text font-semibold'
              radius='full'
              onPress={handleSave}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>

        <div className='ml-8 mr-6 mt-6 flex flex-col gap-4 pb-8'>
          <div className='bg-base/50 rounded-xl border border-border/40 overflow-hidden'>
            {isLoading ? (
              <div className='flex justify-center p-12'>
                <Spinner />
              </div>
            ) : achievements.length === 0 ? (
              <div className='flex justify-center p-12'>
                <p>{t('achievementManager.achievements.empty')}</p>
              </div>
            ) : (
              <>
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
                      step='any'
                      placeholder='0'
                      className='w-16 mr-1'
                      value={delayBeforeFirstUnlock.toString()}
                      onChange={e => {
                        const v = e.target.value
                        setDelayBeforeFirstUnlock(v === '' ? '' : Math.max(0, Number(v)))
                      }}
                      classNames={{
                        inputWrapper: cn(
                          'bg-input data-[hover=true]:!bg-inputhover group-data-[focus-within=true]:!bg-inputhover group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent',
                        ),
                        input: ['!text-content placeholder:text-altwhite/50'],
                      }}
                    />
                    <span className='text-xs text-altwhite'>{t('common.minutes')}</span>
                  </div>
                  <span />
                </div>
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                  autoScroll={{ canScroll: el => el === listRef.current }}
                >
                  <SortableContext items={achievements.map(a => a.name)}>
                    <List
                      outerRef={listRef}
                      height={windowH - 257}
                      itemCount={achievements.length}
                      itemSize={60}
                      width='100%'
                      itemData={rowData}
                    >
                      {SortableRow}
                    </List>
                  </SortableContext>
                  <DragOverlay>
                    {activeAchievement ? (
                      <div className='bg-card shadow-xl rounded-lg px-3 py-2.5 cursor-grabbing'>
                        <p className='font-semibold'>{activeAchievement.name}</p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </>
            )}
          </div>
        </div>
      </div>
      <ImportTimingsModal
        isOpen={isImportOpen}
        onOpenChange={onImportOpenChange}
        appId={item.appid}
        achievements={achievements}
        onImport={setAchievements}
      />
    </div>
  )
}
