import type { Achievement, UserSummary } from '@/types'
import type { CSSProperties, Dispatch, ReactElement, SetStateAction } from 'react'

import { Button, cn } from '@heroui/react'
import { memo, useMemo } from 'react'
import { useSearchStore } from '@/stores/searchStore'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbCancel, TbLock, TbLockOpen } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'

import AchievementButtons from '@/components/achievements/AchievementButtons'
import CustomTooltip from '@/components/ui/CustomTooltip'
import { toggleAchievement } from '@/utils/achievements'
import { checkSteamStatus } from '@/utils/tasks'

interface RowData {
  userSummary: UserSummary
  appId: number
  appName: string
  filteredAchievements: Achievement[]
  updateAchievement: (achievementId: string, newAchievedState: boolean) => void
  t: (key: string) => string
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement | null => {
  const { userSummary, appId, appName, filteredAchievements, updateAchievement, t } = data
  const item = filteredAchievements[index]

  if (!item) return null

  const achieved = item.achieved || false
  const protectedAchievement = item.protected_achievement || false
  const percent = item.percent || 0
  const hidden = item.hidden || false

  const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'
  const icon = achieved ? `${iconUrl}${appId}/${item.iconNormal}` : `${iconUrl}${appId}/${item.iconLocked}`

  const handleToggle = async (): Promise<void> => {
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
            <Image className='rounded-full' src={icon} width={40} height={40} alt={`${item.name} image`} priority />
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
              protectedAchievement ? <TbCancel size={20} /> : achieved ? <TbLock size={20} /> : <TbLockOpen size={20} />
            }
          >
            {protectedAchievement
              ? t('achievementManager.achievements.protected')
              : achieved
                ? t('achievementManager.achievements.lock')
                : t('achievementManager.achievements.unlock')}
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
  setAchievements: Dispatch<SetStateAction<Achievement[]>>
  protectedAchievements: boolean
  windowInnerHeight: number
  setRefreshKey: Dispatch<SetStateAction<number>>
}

export default function AchievementsList({
  achievements,
  setAchievements,
  protectedAchievements,
  windowInnerHeight,
  setRefreshKey,
}: AchievementsListProps): ReactElement {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const achievementQueryValue = useSearchStore(state => state.achievementQueryValue)
  const appId = useStateStore(state => state.appId)
  const appName = useStateStore(state => state.appName)

  const updateAchievement = (achievementId: string, newAchievedState: boolean): void => {
    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement =>
        achievement.id === achievementId ? { ...achievement, achieved: newAchievedState } : achievement,
      )
    })
  }

  const filteredAchievements = useMemo(
    () =>
      achievements.filter(achievement => achievement.name.toLowerCase().includes(achievementQueryValue.toLowerCase())),
    [achievements, achievementQueryValue],
  )

  const itemData: RowData = {
    userSummary,
    appId: appId as number,
    appName: appName as string,
    filteredAchievements,
    updateAchievement,
    t,
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
