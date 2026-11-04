import type { OwnedGame } from '@/features/games-list/types'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbPlus } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface AchievementUnlockerGameCardProps {
  game: OwnedGame
  isQueued: boolean
  isPending: boolean
  onToggle: () => void
}

// Used in the "All Games" tab - mirrors FavoriteGameCard's single toggle action, for queue
// membership instead of favorite membership.
export const AchievementUnlockerGameCard = ({
  game,
  isQueued,
  isPending,
  onToggle,
}: AchievementUnlockerGameCardProps) => {
  const { t } = useTranslation()
  const displayName = game.name ?? t('dashboard.games.unknownName', { appId: game.appId })

  return (
    <GamePosterCard
      showStats
      actions={
        <GamePosterAction
          aria-label={isQueued ? `Remove ${displayName}` : `Add ${displayName}`}
          isPending={isPending}
          onPress={onToggle}
        >
          {isQueued ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
        </GamePosterAction>
      }
      appId={game.appId}
      isSelected={isQueued}
      name={displayName}
    />
  )
}
