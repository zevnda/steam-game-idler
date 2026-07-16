import type { GameWithDrops } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbCheck, TbPlus } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'

interface CardFarmingBrowseCardProps {
  game: GameWithDrops
  isQueued: boolean
  isPending: boolean
  isBlacklistPending: boolean
  onToggle: () => void
  onBlacklist: () => void
}

// Used in the "Games With Drops" tab - mirrors AchievementUnlockerGameCard's shape (thumbnail +
// name + icon-only action buttons), swapping the award icon for a cards icon and adding a
// drops-remaining count. A blacklisted game never appears here at all (filtered out server-side
// by `get_games_with_drops` - see `card_farming::blacklist`'s doc comment), so the ban button only
// ever needs to add, never toggle/undo - un-blacklisting happens from the "Blacklisted" tab.
export const CardFarmingBrowseCard = ({
  game,
  isQueued,
  isPending,
  isBlacklistPending,
  onToggle,
  onBlacklist,
}: CardFarmingBrowseCardProps) => {
  const { t } = useTranslation()

  return (
    <div className='group flex flex-col gap-2' {...gameCardContextAttrs(game.appId, game.name)}>
      <GameThumbnail appId={game.appId} name={game.name} />
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <Typography
            className='transition-colors duration-150 group-hover:text-foreground'
            color='muted'
            title={game.name}
            truncate
            type='body-sm'
            weight='semibold'
          >
            {game.name}
          </Typography>
          <Typography color='muted' type='body-xs'>
            {t('dashboard.cardFarming.progress.dropsRemaining', { count: game.remaining })}
          </Typography>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <Button
            isIconOnly
            aria-label={`Blacklist ${game.name}`}
            isPending={isBlacklistPending}
            size='sm'
            variant='ghost'
            onPress={onBlacklist}
          >
            <TbBan fontSize={16} />
          </Button>
          <Button
            isIconOnly
            aria-label={isQueued ? `Remove ${game.name}` : `Add ${game.name}`}
            isPending={isPending}
            size='sm'
            variant='ghost'
            onPress={onToggle}
          >
            {isQueued ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
