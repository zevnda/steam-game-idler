import { useTranslation } from 'react-i18next'
import { TbRefresh, TbSettings } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

interface FreeGamesPageHeaderProps {
  gameCount: number
  isRefreshing: boolean
  onRefresh: () => void
}

export const FreeGamesPageHeader = ({
  gameCount,
  isRefreshing,
  onRefresh,
}: FreeGamesPageHeaderProps) => {
  const { t } = useTranslation()
  const openSettings = useSettingsModalStore(state => state.open)

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.freeGames')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {gameCount > 0
            ? t('dashboard.freeGames.count', { count: gameCount })
            : t('dashboard.freeGames.empty.title')}
        </Typography>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button
          isIconOnly
          aria-label={t('common.actions.refresh')}
          isPending={isRefreshing}
          onPress={onRefresh}
        >
          <TbRefresh />
        </Button>
        <Button
          isIconOnly
          aria-label={t('common.actions.settings')}
          onPress={() => openSettings('freeGames')}
        >
          <TbSettings />
        </Button>
      </div>
    </div>
  )
}
