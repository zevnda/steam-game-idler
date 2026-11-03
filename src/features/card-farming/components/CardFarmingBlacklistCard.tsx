import type { CardFarmingBlacklistEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface CardFarmingBlacklistCardProps {
  game: CardFarmingBlacklistEntry
  isPending: boolean
  onRemove: () => void
}

// Used in the "Blacklisted" tab - mirrors CardFarmingWhitelistCard's single remove action -
// neither list has any ordering concept, only membership.
export const CardFarmingBlacklistCard = ({
  game,
  isPending,
  onRemove,
}: CardFarmingBlacklistCardProps) => {
  return (
    <GamePosterCard
      actions={
        <GamePosterAction
          aria-label={`Remove ${game.name} from blacklist`}
          isPending={isPending}
          onPress={onRemove}
        >
          <TbX fontSize={16} />
        </GamePosterAction>
      }
      appId={game.appId}
      name={game.name}
    />
  )
}
