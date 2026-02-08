import type { Achievement, UserSummary } from '@/shared/types'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCancel, TbLock, TbLockOpen } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { Button, cn } from '@heroui/react'
import i18next from 'i18next'
import Image from 'next/image'
import { AchievementButtons } from '@/features/achievement-manager'
import { useSearchStore, useStateStore, useUserStore } from '@/shared/stores'
import { CustomTooltip } from '@/shared/ui'
import { checkSteamStatus, toggleAchievement } from '@/shared/utils'

interface RowData {
  userSummary: UserSummary
  appId: number
  appName: string
  filteredAchievements: Achievement[]
  updateAchievement: (achievementId: string, newAchievedState: boolean) => void
}

interface RowProps {
  index: number
  style: React.CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps) => {
  const { userSummary, appId, appName, filteredAchievements, updateAchievement } = data
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
    <div style={style} className='grid grid-cols-1 pb-4 pr-6'>
      <div className='rounded-lg shadow-sm group'>
        <div className='flex items-center py-3 px-3 bg-achievement-main rounded-t-lg'>
          <div className='w-10 h-10 flex items-center justify-center'>
            <Image
              className='rounded-full'
              src={icon}
              width={40}
              height={40}
              alt={`${item.name} image`}
              priority
            />
          </div>
          <div className='flex flex-col grow ml-4'>
            <CustomTooltip placement='right' content={item.id}>
              <p className='font-bold text-sm w-fit'>{item.name}</p>
            </CustomTooltip>
            <div className='w-fit'>
              <p
                className={cn(
                  'text-sm text-altwhite',
                  hidden && 'blur-[3px] group-hover:blur-none transition-all duration-200',
                )}
              >
                {item.description || ''}
              </p>
            </div>
          </div>
          <Button
            isDisabled={protectedAchievement}
            size='sm'
            radius='full'
            className={cn(
              'font-bold',
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
        <div className='py-2 px-3 bg-achievement-footer select-none rounded-b-lg'>
          <div className='w-full bg-item-active rounded-full h-3.5 relative'>
            <div
              className='bg-dynamic/40 h-3.5 rounded-full flex items-center'
              style={{
                width: `${percent}%`,
                position: 'relative',
              }}
            />
            {percent !== undefined && (
              <p className='text-[11px] text-white absolute inset-0 flex items-center justify-center'>
                {percent.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
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
  }

  return (
    <div className='flex flex-col gap-2 w-full scroll-smooth'>
      {achievements.length > 0 ? (
        <>
          <AchievementButtons
            achievements={achievements}
            setAchievements={setAchievements}
            protectedAchievements={protectedAchievements}
            setRefreshKey={setRefreshKey}
          />

          <List
            height={windowInnerHeight - 196}
            itemCount={filteredAchievements.length}
            itemSize={110}
            width='100%'
            itemData={itemData}
          >
            {Row}
          </List>
        </>
      ) : (
        <div className='flex flex-col gap-2 justify-center items-center my-2 bg-tab-panel rounded-lg p-4 mr-10'>
          <p>{t('achievementManager.achievements.empty')}</p>
        </div>
      )}
    </div>
  )
}
