import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbPlus, TbSettings } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

interface CardFarmingPageHeaderProps {
  connected: boolean
  queueCount: number
  isFarming: boolean
  activeCount: number
  // Null until useCardFarming's own settings copy has loaded (see its `refreshSettingsMode` doc
  // comment) - falls back to the generic idle copy for that brief window rather than guessing.
  allGames: boolean | null
  isStarting: boolean
  isStopping: boolean
  onStart: () => void
  onStop: () => void
  onManualAdd: () => void
}

// Mirrors AchievementUnlockerPageHeader's shape (title/status, start/stop, settings) - only shown
// once `connected` (before that, `CardFarmingStartPanel` occupies the whole page, so there's
// nothing here to start yet). While idle, the status line shows the current farming mode
// (all games vs. games in queue) instead of a generic "not farming" - the mode is otherwise only
// visible inside the Settings modal.
export const CardFarmingPageHeader = ({
  connected,
  queueCount,
  isFarming,
  activeCount,
  allGames,
  isStarting,
  isStopping,
  onStart,
  onStop,
  onManualAdd,
}: CardFarmingPageHeaderProps) => {
  const { t } = useTranslation()
  const openSettings = useSettingsModalStore(state => state.open)

  const idleStatus =
    allGames === null
      ? t('dashboard.cardFarming.status.idle')
      : allGames
        ? t('dashboard.cardFarming.status.modeAllGames')
        : t('dashboard.cardFarming.status.modeQueue')

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.cardFarming')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {isFarming
            ? t('dashboard.cardFarming.status.farming', { count: activeCount })
            : idleStatus}
        </Typography>
      </div>
      {connected && (
        <div className='flex shrink-0 items-center gap-2'>
          {isFarming ? (
            <Button isPending={isStopping} variant='danger' onPress={onStop}>
              <TbPlayerStopFilled fontSize={18} />
              {t('dashboard.cardFarming.actions.stop')}
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
            onPress={() => openSettings('cardFarming')}
          >
            <TbSettings fontSize={18} />
          </Button>
        </div>
      )}
    </div>
  )
}
