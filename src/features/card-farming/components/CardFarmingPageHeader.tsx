import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbSettings } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

interface CardFarmingPageHeaderProps {
  connected: boolean
  isFarming: boolean
  activeCount: number
  // Whether there's anything at all in the account's "games with drops" browse list - the only
  // thing that gates the Start button now (see this component's doc comment). `true` while the
  // browse list is still loading, so Start doesn't flash disabled before that resolves.
  hasEligibleGames: boolean
  isStarting: boolean
  isStopping: boolean
  onStart: () => void
  onStop: () => void
}

// Mirrors AchievementUnlockerPageHeader's shape (title/status, start/stop, settings) - shown once
// `connected`, or once `isFarming` (before that, `CardFarmingStartPanel` occupies the whole page,
// so there's nothing here to start yet). The `isFarming` half of that check matters because
// `connected` is local `useCardFarming` state that resets on every CardFarmingPage remount and
// only flips back to true once `useAutoConnectSteamCookies` re-resolves cookies and re-scrapes
// browse data - but a farming cycle already running is proof the account was connected, and
// `state.isFarming` reflects that instantly via the account-scoped `cardFarmingStore` (kept live
// by `useCardFarmingSync` regardless of which page is mounted), so Stop/Settings shouldn't wait on
// a fresh reconnect just to reappear.
//
// There is no "farming mode" status line anymore (all games / games in queue) - scope is entirely
// automatic now (see `card_farming::manager`'s module doc comment), so the idle status collapses to
// the generic "not farming" copy; a whitelist, when the user has one, is visible on its own tab
// instead of being summarized here.
export const CardFarmingPageHeader = ({
  connected,
  isFarming,
  activeCount,
  hasEligibleGames,
  isStarting,
  isStopping,
  onStart,
  onStop,
}: CardFarmingPageHeaderProps) => {
  const { t } = useTranslation()
  const openSettings = useSettingsModalStore(state => state.open)

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.cardFarming')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {isFarming
            ? t('dashboard.cardFarming.status.farming', { count: activeCount })
            : t('dashboard.cardFarming.status.idle')}
        </Typography>
      </div>
      {(connected || isFarming) && (
        <div className='flex shrink-0 items-center gap-2'>
          {isFarming ? (
            <Button isPending={isStopping} variant='danger' onPress={onStop}>
              <TbPlayerStopFilled fontSize={18} />
              {t('dashboard.cardFarming.actions.stop')}
            </Button>
          ) : (
            <Button
              isDisabled={!hasEligibleGames}
              isPending={isStarting}
              variant='primary'
              onPress={onStart}
            >
              <TbPlayerPlayFilled fontSize={16} />
              {t('common.actions.start')}
            </Button>
          )}
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
