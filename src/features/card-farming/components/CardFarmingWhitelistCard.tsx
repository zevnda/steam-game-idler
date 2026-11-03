import type { CardFarmingWhitelistEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface CardFarmingWhitelistCardProps {
  game: CardFarmingWhitelistEntry
  isPending: boolean
  onRemove: () => void
}

// Used in the "Whitelist" tab - mirrors CardFarmingBlacklistCard's single remove action, with no
// drag-to-reorder: the whitelist has no ordering concept either, only
// membership - see `card_farming::whitelist`'s doc comment.
export const CardFarmingWhitelistCard = ({
  game,
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
      name={game.name}
    />
  )
}
