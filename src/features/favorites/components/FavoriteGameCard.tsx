import type { OwnedGame } from '@/features/games-list/types'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbPlus } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface FavoriteGameCardProps {
  game: OwnedGame
  isFavorited: boolean
  isPending: boolean
  onToggle: () => void
}

// Used in the "All Games" tab - every owned game with a single toggle action for favorite
// membership.
export const FavoriteGameCard = ({
  game,
  isFavorited,
  isPending,
  onToggle,
}: FavoriteGameCardProps) => {
  const { t } = useTranslation()
  const displayName = game.name ?? t('dashboard.games.unknownName', { appId: game.appId })

  return (
    <GamePosterCard
      showStats
      actions={
        <GamePosterAction
          aria-label={
            isFavorited ? `Remove ${displayName} from favorites` : `Add ${displayName} to favorites`
          }
          isPending={isPending}
          onPress={onToggle}
        >
          {isFavorited ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
        </GamePosterAction>
      }
      appId={game.appId}
      isSelected={isFavorited}
      name={displayName}
    />
  )
}
