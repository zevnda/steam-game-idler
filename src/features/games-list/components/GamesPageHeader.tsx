import type { OwnedGameSortStyle } from '@/shared/utils/sortOwnedGames'
import { useTranslation } from 'react-i18next'
import { TbRefresh } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { OWNED_GAME_SORT_LABEL_KEYS, OWNED_GAME_SORT_STYLES } from '@/shared/utils/sortOwnedGames'

interface GamesPageHeaderProps {
  gameCount: number
  isRefreshing: boolean
  sortStyle: OwnedGameSortStyle
  onSortStyleChange: (style: OwnedGameSortStyle) => void
  onRefresh: () => void
}

export const GamesPageHeader = ({
  gameCount,
  isRefreshing,
  sortStyle,
  onSortStyleChange,
  onRefresh,
}: GamesPageHeaderProps) => {
  const { t } = useTranslation()

  const sortOptions = OWNED_GAME_SORT_STYLES.map(style => ({
    id: style,
    label: t(OWNED_GAME_SORT_LABEL_KEYS[style]),
  }))

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.games')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {t('dashboard.games.count', { count: gameCount })}
        </Typography>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <GameSortSelect
          ariaLabel='Sort games'
          options={sortOptions}
          value={sortStyle}
          onChange={onSortStyleChange}
        />
        <Button
          isIconOnly
          aria-label={t('common.actions.refresh')}
          isPending={isRefreshing}
          onPress={onRefresh}
        >
          <TbRefresh fontSize={18} />
        </Button>
      </div>
    </div>
  )
}
