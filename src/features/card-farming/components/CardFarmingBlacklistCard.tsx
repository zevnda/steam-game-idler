import type { CardFarmingBlacklistEntry, GameWithDrops } from '../types'
import { TbX } from 'react-icons/tb'
import { CardFarmingCardChips } from './CardFarmingCardChips'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface CardFarmingBlacklistCardProps {
  game: CardFarmingBlacklistEntry
  drops: GameWithDrops | undefined
  isPending: boolean
  onRemove: () => void
}

// Used in the "Blacklisted" tab - mirrors CardFarmingWhitelistCard's single remove action -
// neither list has any ordering concept, only membership.
export const CardFarmingBlacklistCard = ({
  game,
  drops,
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
      badge={<CardFarmingCardChips appId={game.appId} drops={drops} />}
      name={game.name}
    />
  )
}
