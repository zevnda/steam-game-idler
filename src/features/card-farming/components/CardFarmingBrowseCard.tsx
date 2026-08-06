import type { GameWithDrops } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbCheck, TbPlus } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'

interface CardFarmingBrowseCardProps {
  game: GameWithDrops
  isWhitelisted: boolean
  isPending: boolean
  isBlacklistPending: boolean
  onToggleWhitelist: () => void
  onBlacklist: () => void
}

// Used in the "Games With Drops" tab - mirrors AchievementUnlockerGameCard's shape (thumbnail +
// name + icon-only action buttons), swapping the award icon for a cards icon and adding a
// drops-remaining count. A blacklisted game never appears here at all (filtered out server-side
// by `get_games_with_drops` - see `card_farming::blacklist`'s doc comment), so the ban button only
// ever needs to add, never toggle/undo - un-blacklisting happens from the "Blacklisted" tab. The
// whitelist button toggles both ways from here, though - it's a scope list the user can freely add
// to and remove from (see `card_farming::whitelist`'s doc comment).
export const CardFarmingBrowseCard = ({
  game,
  isWhitelisted,
  isPending,
  isBlacklistPending,
  onToggleWhitelist,
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
            aria-label={
              isWhitelisted ? `Remove ${game.name} from whitelist` : `Add ${game.name} to whitelist`
            }
            isPending={isPending}
            size='sm'
            variant='ghost'
            onPress={onToggleWhitelist}
          >
            {isWhitelisted ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
