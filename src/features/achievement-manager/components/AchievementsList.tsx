import type { Achievement, UserSummary } from '@/shared/types'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCancel, TbLock, TbLockOpen } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { Button, Checkbox, cn } from '@heroui/react'
import i18next from 'i18next'
import Image from 'next/image'
import { AchievementButtons } from '@/features/achievement-manager'
import { CustomTooltip } from '@/shared/components'
import { useSearchStore, useStateStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus, toggleAchievement } from '@/shared/utils'

interface RowData {
  userSummary: UserSummary
  appId: number
  appName: string
  filteredAchievements: Achievement[]
  updateAchievement: (achievementId: string, newAchievedState: boolean) => void
  selectedToUnlock: Set<string>
  setSelectedToUnlock: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedToLock: Set<string>
  setSelectedToLock: React.Dispatch<React.SetStateAction<Set<string>>>
}

interface RowProps {
  index: number
  style: React.CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps) => {
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
  const protectedAchievement = item.protected_achievement || false
  const percent = item.percent || 0
  const hidden = item.hidden || false

  const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
  const icon = achieved
    ? `${iconUrl}${appId}/${item.iconNormal}`
    : `${iconUrl}${appId}/${item.iconLocked}`

  const isSelected = achieved ? !selectedToLock.has(item.id) : selectedToUnlock.has(item.id)

  const handleCheckboxChange = (checked: boolean) => {
    if (achieved) {
      setSelectedToLock(prev => {
        const next = new Set(prev)
        if (!checked) {
          next.add(item.id)
        } else {
          next.delete(item.id)
        }
        return next
      })
    } else {
      setSelectedToUnlock(prev => {
        const next = new Set(prev)
        if (checked) {
          next.add(item.id)
        } else {
          next.delete(item.id)
        }
        return next
      })
    }
  }

  const handleToggle = async () => {
    // Make sure Steam client is running
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return
    const success = await toggleAchievement(
      userSummary?.steamId,
      appId,
      item.id,
      appName,
      achieved ? 'Locked' : 'Unlocked',
    )
    if (success) {
      updateAchievement(item.id, !achieved)
    }
  }

  return (
    <div style={style} className=''>
      <div
        className={cn(
          'grid grid-cols-[28px_40px_1fr_auto] items-center gap-3 px-3 py-2.5',
          'bg-card hover:bg-sidebar/60 group duration-150',
          (protectedAchievement || achieved) && 'opacity-40',
        )}
      >
        {/* Checkbox */}
        <div className='flex items-center justify-center'>
          <Checkbox
            isSelected={isSelected}
            isDisabled={protectedAchievement}
            onValueChange={handleCheckboxChange}
            size='sm'
          />
        </div>

        {/* Icon */}
        <Image
          className='rounded-full select-none'
          src={icon}
          width={36}
          height={36}
          alt={`${item.name} image`}
          priority
        />

        {/* Name + description */}
        <div className='min-w-0 select-none'>
          <div className='flex items-baseline gap-2 min-w-0'>
            <CustomTooltip placement='right' content={item.id}>
              <p className='font-semibold truncate'>{item.name}</p>
            </CustomTooltip>
            {percent !== undefined && percent > 0 && (
              <span className='text-xs text-altwhite/60 shrink-0'>{percent.toFixed(1)}%</span>
            )}
          </div>
          <p
            className={cn(
              'text-xs text-altwhite truncate',
              hidden && 'blur-[3px] group-hover:blur-none transition-all duration-200',
            )}
          >
            {item.description || ''}
          </p>
        </div>

        {/* Action button */}
        <Button
          isDisabled={protectedAchievement}
          size='sm'
          radius='full'
          className={cn(
            'font-bold shrink-0',
            protectedAchievement
              ? 'bg-warning'
              : achieved
                ? 'bg-danger text-white'
                : 'bg-btn-secondary text-btn-text',
          )}
          onPress={handleToggle}
          startContent={
            protectedAchievement ? (
              <TbCancel size={20} />
            ) : achieved ? (
              <TbLock size={20} />
            ) : (
              <TbLockOpen size={20} />
            )
          }
        >
          {protectedAchievement
            ? i18next.t('achievementManager.achievements.protected')
            : achieved
              ? i18next.t('achievementManager.achievements.lock')
              : i18next.t('achievementManager.achievements.unlock')}
        </Button>
      </div>
    </div>
  )
})

Row.displayName = 'Row'

interface AchievementsListProps {
  achievements: Achievement[]
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  protectedAchievements: boolean
  windowInnerHeight: number
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
}

export const AchievementsList = ({
  achievements,
  setAchievements,
  protectedAchievements,
  windowInnerHeight,
  setRefreshKey,
}: AchievementsListProps) => {
  const { t } = useTranslation()
  const [selectedToUnlock, setSelectedToUnlock] = useState<Set<string>>(new Set())
  const [selectedToLock, setSelectedToLock] = useState<Set<string>>(new Set())
  const userSummary = useUserStore(state => state.userSummary)
  const achievementQueryValue = useSearchStore(state => state.achievementQueryValue)
  const appId = useStateStore(state => state.appId)
  const appName = useStateStore(state => state.appName)

  const updateAchievement = (achievementId: string, newAchievedState: boolean) => {
    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement =>
        achievement.id === achievementId
          ? { ...achievement, achieved: newAchievedState }
          : achievement,
      )
    })
    // Clear from selection sets when manually toggled
    if (newAchievedState) {
      setSelectedToUnlock(prev => {
        const next = new Set(prev)
        next.delete(achievementId)
        return next
      })
    } else {
      setSelectedToLock(prev => {
        const next = new Set(prev)
        next.delete(achievementId)
        return next
      })
    }
  }

  const filteredAchievements = useMemo(
    () =>
      achievements.filter(achievement =>
        achievement.name.toLowerCase().includes(achievementQueryValue.toLowerCase()),
      ),
    [achievements, achievementQueryValue],
  )

  const itemData: RowData = {
    userSummary,
    appId: appId as number,
    appName: appName as string,
    filteredAchievements,
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
          <>
            {/* Sticky column header */}
            <div className='grid grid-cols-[28px_40px_1fr_auto] items-center gap-3 px-3 py-2 border-b border-border/40 sticky top-0 bg-sidebar z-10'>
              <span className='text-sm font-semibold text-content'>
                {t('achievementManager.achievements.title')}
              </span>
            </div>

            {/* List */}
            <List
              height={windowInnerHeight - 270}
              itemCount={filteredAchievements.length}
              itemSize={60}
              width='100%'
              itemData={itemData}
            >
              {Row}
            </List>
          </>
        )}
      </div>
    </div>
  )
}
