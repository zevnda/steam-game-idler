import type { UpcomingAchievement } from '../hooks/useAchievementUnlocker'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbHourglassHigh } from 'react-icons/tb'
import { formatTime } from '../hooks/useAchievementUnlocker'
import { cn } from '@heroui/react'
import Image from 'next/image'

const ACHIEVEMENT_ICON_BASE_URL =
  'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'

interface UpcomingAchievementsListProps {
  appId: number | undefined
  achievements: UpcomingAchievement[]
}

export const UpcomingAchievementsList = ({
  appId,
  achievements,
}: UpcomingAchievementsListProps) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  if (!appId || achievements.length === 0) return null

  return (
    <div className='flex flex-col gap-3 w-80 shrink-0 p-4 bg-tab-panel min-h-[40vh] rounded-4xl border border-border overflow-y-auto'>
      <p className='text-xs font-bold uppercase tracking-wider text-altwhite px-1 select-none'>
        {t('automation.achievementUnlocker.upNext')}
      </p>

      <div className='flex flex-col gap-2'>
        {achievements.map((achievement, index) => {
          const remainingMs = Math.max(0, achievement.unlockAt - now)
          const isNext = index === 0

          return (
            <div
              key={achievement.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl border duration-150 select-none',
                isNext ? 'bg-dynamic/10 border-dynamic/30' : 'bg-sidebar/50 border-border',
              )}
            >
              <Image
                className='rounded-full shrink-0'
                src={`${ACHIEVEMENT_ICON_BASE_URL}${appId}/${achievement.iconLocked}`}
                width={32}
                height={32}
                alt={`${achievement.name} image`}
              />

              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold truncate'>{achievement.name}</p>
                {achievement.percentage > 0 && (
                  <p className='text-xs text-altwhite/70'>{achievement.percentage.toFixed(1)}%</p>
                )}
              </div>

              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono shrink-0',
                  isNext ? 'bg-dynamic/15 text-dynamic font-bold' : 'bg-input text-altwhite',
                )}
              >
                <TbHourglassHigh size={12} />
                {formatTime(remainingMs)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
