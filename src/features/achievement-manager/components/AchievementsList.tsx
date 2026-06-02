import type { Achievement } from '@/shared/types'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCancel, TbLock, TbLockOpen } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { Button, Checkbox, cn } from '@heroui/react'
import Image from 'next/image'
import { AchievementButtons } from '@/features/achievement-manager/components/AchievementButtons'
import { toggleAchievementById } from '@/features/achievement-manager/services/achievementsService'
import { CustomTooltip } from '@/shared/components/CustomTooltip'
import { useUiStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus } from '@/shared/utils'

interface AchievementsListProps {
  achievements: Achievement[]
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  protectedAchievements: boolean
  windowInnerHeight: number
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>
}

interface RowData {
  userSummary: ReturnType<typeof useUserStore.getState>['userSummary']
  appId: number
  appName: string
  filteredAchievements: Achievement[]
  updateAchievement: (id: string, achieved: boolean) => void
  selectedToUnlock: Set<string>
  setSelectedToUnlock: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedToLock: Set<string>
  setSelectedToLock: React.Dispatch<React.SetStateAction<Set<string>>>
}

const Row = memo(
  ({ index, style, data }: { index: number; style: React.CSSProperties; data: RowData }) => {
    const {
      userSummary,
      appId,
      appName,
      filteredAchievements,
      updateAchievement,
      selectedToUnlock,
      setSelectedToUnlock,
      selectedToLock,
      setSelectedToLock,
    } = data
    const item = filteredAchievements[index]
    if (!item) return null

    const achieved = item.achieved || false
    const isProtected = item.protected_achievement || false
    const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
    const icon = achieved
      ? `${iconUrl}${appId}/${item.iconNormal}`
      : `${iconUrl}${appId}/${item.iconLocked}`
    const isSelected = achieved ? !selectedToLock.has(item.id) : selectedToUnlock.has(item.id)

    const handleCheckboxChange = (checked: boolean) => {
      if (achieved) {
        if (checked) {
          setSelectedToLock(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
        } else {
          setSelectedToLock(prev => new Set([...prev, item.id]))
        }
      } else {
        if (checked) {
          setSelectedToUnlock(prev => new Set([...prev, item.id]))
        } else {
          setSelectedToUnlock(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
        }
      }
    }

    const handleToggle = async () => {
      if (isProtected) return
      const running = await checkSteamStatus(true)
      if (!running) return
      const type = achieved ? 'Locked' : 'Unlocked'
      const ok = await toggleAchievementById(userSummary?.steamId, appId, item.id, appName, type)
      if (ok) updateAchievement(item.id, !achieved)
    }

    return (
      <div
        style={style}
        className={cn(
          'grid grid-cols-[28px_40px_1fr_auto] items-center gap-3 px-3 hover:bg-item-hover/50 duration-150 cursor-pointer',
          achieved ? 'opacity-100' : 'opacity-70',
        )}
      >
        <Checkbox
          size='sm'
          isSelected={isSelected}
          isDisabled={isProtected}
          classNames={{ wrapper: cn('group-data-[selected=true]:!bg-dynamic') }}
          onValueChange={handleCheckboxChange}
        />
        <Image
          src={icon}
          width={40}
          height={40}
          alt={item.name}
          onError={e => {
            ;(e.target as HTMLImageElement).src = '/fallback.webp'
          }}
          className='rounded'
        />
        <div className='min-w-0'>
          <p
            className={cn(
              'text-sm font-semibold truncate',
              achieved ? 'text-content' : 'text-altwhite',
            )}
          >
            {item.name}
          </p>
          <p className='text-xs text-altwhite/70 truncate'>{item.description}</p>
          {item.percent > 0 && (
            <p className='text-xs text-altwhite/50'>{item.percent.toFixed(1)}%</p>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {isProtected ? (
            <CustomTooltip content='Protected'>
              <TbCancel size={18} className='text-danger' />
            </CustomTooltip>
          ) : (
            <Button
              isIconOnly
              size='sm'
              radius='full'
              className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content'
              onPress={handleToggle}
            >
              {achieved ? <TbLock size={16} /> : <TbLockOpen size={16} />}
            </Button>
          )}
        </div>
      </div>
    )
  },
)

export function AchievementsList({
  achievements,
  setAchievements,
  protectedAchievements,
  windowInnerHeight,
  setRefreshKey,
}: AchievementsListProps) {
  const { t } = useTranslation()
  const [selectedToUnlock, setSelectedToUnlock] = useState<Set<string>>(new Set())
  const [selectedToLock, setSelectedToLock] = useState<Set<string>>(new Set())
  const userSummary = useUserStore(s => s.userSummary)
  const achievementQuery = useUiStore(s => s.achievementQuery)
  const selectedGame = useUiStore(s => s.selectedGame)

  const updateAchievement = (id: string, achieved: boolean) => {
    setAchievements(prev => prev.map(a => (a.id === id ? { ...a, achieved } : a)))
    if (achieved)
      setSelectedToUnlock(prev => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
    else
      setSelectedToLock(prev => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
  }

  const filtered = useMemo(
    () => achievements.filter(a => a.name.toLowerCase().includes(achievementQuery.toLowerCase())),
    [achievements, achievementQuery],
  )

  const itemData: RowData = {
    userSummary,
    appId: selectedGame?.appid ?? 0,
    appName: selectedGame?.name ?? '',
    filteredAchievements: filtered,
    updateAchievement,
    selectedToUnlock,
    setSelectedToUnlock,
    selectedToLock,
    setSelectedToLock,
  }

  return (
    <div className='flex flex-col gap-2 w-full scroll-smooth'>
      <AchievementButtons
        achievements={achievements}
        setAchievements={setAchievements}
        protectedAchievements={protectedAchievements}
        setRefreshKey={setRefreshKey}
        selectedToUnlock={selectedToUnlock}
        setSelectedToUnlock={setSelectedToUnlock}
        selectedToLock={selectedToLock}
        setSelectedToLock={setSelectedToLock}
      />
      <div className='border border-border/40 rounded-xl overflow-hidden bg-base/50'>
        {achievements.length === 0 ? (
          <div className='flex justify-center items-center p-12'>
            <p className='text-center text-content'>{t('achievementManager.achievements.empty')}</p>
          </div>
        ) : (
          <List
            height={windowInnerHeight - 282}
            itemCount={filtered.length}
            itemSize={60}
            width='100%'
            itemData={itemData}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  )
}
