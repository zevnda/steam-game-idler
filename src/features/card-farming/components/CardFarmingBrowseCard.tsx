import type { GameWithDrops } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbCheck, TbPlus } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface CardFarmingBrowseCardProps {
  game: GameWithDrops
  isWhitelisted: boolean
  isPending: boolean
  isBlacklistPending: boolean
  onToggleWhitelist: () => void
  onBlacklist: () => void
}

// Used in the "Games With Drops" tab - mirrors AchievementUnlockerGameCard, plus a drops-remaining
// count and a blacklist action. A blacklisted game never appears here at all (filtered out server-side
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
    <GamePosterCard
      actions={
        <>
          <GamePosterAction
            aria-label={
              isWhitelisted ? `Remove ${game.name} from whitelist` : `Add ${game.name} to whitelist`
            }
            isPending={isPending}
            onPress={onToggleWhitelist}
          >
            {isWhitelisted ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
          </GamePosterAction>
          <GamePosterAction
            aria-label={`Blacklist ${game.name}`}
            isPending={isBlacklistPending}
            onPress={onBlacklist}
          >
            <TbBan fontSize={16} />
          </GamePosterAction>
        </>
      }
      appId={game.appId}
      isSelected={isWhitelisted}
      meta={t('dashboard.cardFarming.progress.dropsRemaining', { count: game.remaining })}
      name={game.name}
    />
  )
}
