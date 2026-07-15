import type { UpcomingAchievement } from '../types'
import { useTranslation } from 'react-i18next'
import { TbHourglassHigh } from 'react-icons/tb'
import { formatCountdown } from '../utils/formatCountdown'
import { cn, Typography } from '@heroui/react'
import Image from 'next/image'

const ACHIEVEMENT_ICON_BASE_URL =
  'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'

interface AchievementUnlockerUpcomingPanelProps {
  appId: number
  achievements: UpcomingAchievement[]
  now: number
}

// Right-hand panel of a running game's row - the next up to 5 achievements queued to unlock, each
// with its own live countdown. Mirrors `main`'s UpcomingAchievementsList.tsx, restyled to this
// rewrite's card/typography tokens (see AchievementOrderRow.tsx for the same icon CDN convention).
export const AchievementUnlockerUpcomingPanel = ({
  appId,
  achievements,
  now,
}: AchievementUnlockerUpcomingPanelProps) => {
  const { t } = useTranslation()

  if (achievements.length === 0) return null

  return (
    <div className='flex h-96 w-full shrink-0 flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm sm:w-80'>
      <Typography className='shrink-0 px-1' color='muted' type='body-xs' weight='semibold'>
        {t('dashboard.achievementUnlocker.progress.upNext')}
      </Typography>

      <div className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto'>
        {achievements.map((achievement, index) => {
          const remainingMs = Math.max(0, achievement.unlockAtMs - now)
          const isNext = index === 0

          return (
            <div
              key={achievement.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-2.5 duration-150',
                isNext ? 'border-accent/30 bg-accent/10' : 'border-border bg-default/50',
              )}
            >
              <Image
                alt=''
                className='shrink-0 rounded-full'
                height={32}
                src={`${ACHIEVEMENT_ICON_BASE_URL}${appId}/${achievement.iconLocked}`}
                width={32}
              />

              <div className='min-w-0 flex-1'>
                <Typography title={achievement.name} truncate type='body-sm' weight='semibold'>
                  {achievement.name}
                </Typography>
                {achievement.percent !== undefined && (
                  <Typography color='muted' type='body-xs'>
                    {achievement.percent.toFixed(1)}%
                  </Typography>
                )}
              </div>

              <div
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-mono text-xs',
                  isNext ? 'bg-accent/15 font-bold text-accent' : 'bg-default text-muted',
                )}
              >
                <TbHourglassHigh fontSize={12} />
                {formatCountdown(remainingMs)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
