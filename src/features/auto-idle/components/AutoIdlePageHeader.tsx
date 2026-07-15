import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'

interface AutoIdlePageHeaderProps {
  gameCount: number
  enabledCount: number
  isStarting: boolean
  onStartNow: () => void
}

export const AutoIdlePageHeader = ({
  gameCount,
  enabledCount,
  isStarting,
  onStartNow,
}: AutoIdlePageHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.autoIdle')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {gameCount > 0
            ? t('common.gamesQueuedCount', { count: gameCount })
            : t('common.noGamesQueued')}
        </Typography>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button
          isDisabled={enabledCount === 0}
          isPending={isStarting}
          variant='primary'
          onPress={onStartNow}
        >
          <TbPlayerPlayFilled fontSize={16} />
          {t('common.actions.start')}
        </Button>
      </div>
    </div>
  )
}
