import type { ScanProgress } from '../hooks/useAchievementUnlocker'
import { useTranslation } from 'react-i18next'
import { cn, Progress } from '@heroui/react'
import { useStateStore } from '@/shared/stores'

interface ScanProgressCardProps {
  progress: ScanProgress
}

export const ScanProgressCard = ({ progress }: ScanProgressCardProps) => {
  const { t } = useTranslation()
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const percentage = progress.total > 0 ? (progress.checked / progress.total) * 100 : 0

  return (
    <div
      className={cn(
        'flex gap-4 ease-in-out shrink-0',
        sidebarCollapsed ? 'w-full' : 'w-[calc(100vw-300px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <div className='flex justify-center items-center flex-col gap-4 p-6 bg-tab-panel w-full rounded-4xl border border-border'>
        <p className='text-lg font-semibold'>{t('automation.achievementUnlocker.scanningTitle')}</p>

        <Progress
          aria-label={t('automation.achievementUnlocker.scanningTitle')}
          value={percentage}
          classNames={{
            base: 'w-full max-w-md',
            track: 'bg-white/10',
            indicator: 'bg-dynamic',
          }}
        />

        <p className='text-xs text-altwhite'>
          {t('automation.achievementUnlocker.scanningCount', {
            checked: progress.checked,
            total: progress.total,
          })}
        </p>
      </div>
    </div>
  )
}
