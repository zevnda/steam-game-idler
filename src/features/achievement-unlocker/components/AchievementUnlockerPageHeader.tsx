import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbPlus, TbSettings } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

interface AchievementUnlockerPageHeaderProps {
  queueCount: number
  isRunning: boolean
  activeCount: number
  isStarting: boolean
  isStopping: boolean
  onStart: () => void
  onStop: () => void
  onManualAdd: () => void
}

export const AchievementUnlockerPageHeader = ({
  queueCount,
  isRunning,
  activeCount,
  isStarting,
  isStopping,
  onStart,
  onStop,
  onManualAdd,
}: AchievementUnlockerPageHeaderProps) => {
  const { t } = useTranslation()
  const openSettings = useSettingsModalStore(state => state.open)

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.achievementUnlocker')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {isRunning
            ? t('dashboard.achievementUnlocker.status.running', { count: activeCount })
            : queueCount > 0
              ? t('common.gamesQueuedCount', { count: queueCount })
              : t('common.noGamesQueued')}
        </Typography>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        {isRunning ? (
          <Button isPending={isStopping} variant='danger' onPress={onStop}>
            <TbPlayerStopFilled fontSize={16} />
            {t('common.actions.stop')}
          </Button>
        ) : (
          <Button
            isDisabled={queueCount === 0}
            isPending={isStarting}
            variant='primary'
            onPress={onStart}
          >
            <TbPlayerPlayFilled fontSize={16} />
            {t('common.actions.start')}
          </Button>
        )}
        <Button isIconOnly aria-label={t('common.manualAdd.title')} onPress={onManualAdd}>
          <TbPlus fontSize={18} />
        </Button>
        <Button
          isIconOnly
          aria-label={t('common.actions.settings')}
          onPress={() => openSettings('achievementUnlocker')}
        >
          <TbSettings fontSize={18} />
        </Button>
      </div>
    </div>
  )
}
