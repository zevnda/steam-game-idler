import type { CardFarmingWhitelistEntry, GameWithDrops } from '../types'
import { TbX } from 'react-icons/tb'
import { CardFarmingCardChips } from './CardFarmingCardChips'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface CardFarmingWhitelistCardProps {
  game: CardFarmingWhitelistEntry
  drops: GameWithDrops | undefined
  isPending: boolean
  onRemove: () => void
}

// Used in the "Whitelist" tab - mirrors CardFarmingBlacklistCard's single remove action, with no
// drag-to-reorder: the whitelist has no ordering concept either, only
// membership - see `card_farming::whitelist`'s doc comment.
export const CardFarmingWhitelistCard = ({
  game,
  drops,
  isPending,
  onRemove,
}: CardFarmingWhitelistCardProps) => {
  return (
    <GamePosterCard
      actions={
        <GamePosterAction
          aria-label={`Remove ${game.name} from whitelist`}
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
