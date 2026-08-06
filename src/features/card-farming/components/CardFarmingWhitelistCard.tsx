import type { CardFarmingWhitelistEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'

interface CardFarmingWhitelistCardProps {
  game: CardFarmingWhitelistEntry
  isPending: boolean
  onRemove: () => void
}

// Used in the "Whitelist" tab - mirrors CardFarmingBlacklistCard's shape exactly (thumbnail + name
// + a single remove button, no drag-to-reorder): the whitelist has no ordering concept either, only
// membership - see `card_farming::whitelist`'s doc comment.
export const CardFarmingWhitelistCard = ({
  game,
  isPending,
  onRemove,
}: CardFarmingWhitelistCardProps) => {
  return (
    <div className='group flex flex-col gap-2' {...gameCardContextAttrs(game.appId, game.name)}>
      <GameThumbnail appId={game.appId} name={game.name} />
      <div className='flex items-center justify-between gap-2'>
        <Typography
          className='min-w-0 transition-colors duration-150 group-hover:text-foreground'
          color='muted'
          title={game.name}
          truncate
          type='body-sm'
          weight='semibold'
        >
          {game.name}
        </Typography>
        <Button
          isIconOnly
          aria-label={`Remove ${game.name} from whitelist`}
          className='shrink-0'
          isPending={isPending}
          size='sm'
          variant='ghost'
          onPress={onRemove}
        >
          <TbX fontSize={16} />
        </Button>
      </div>
    </div>
  )
}
