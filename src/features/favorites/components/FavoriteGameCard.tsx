import type { OwnedGame } from '@/features/games-list/types'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbPlus } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface FavoriteGameCardProps {
  game: OwnedGame
  isFavorited: boolean
  isPending: boolean
  onToggle: () => void
}

// Used in the "All Games" tab - every owned game with a heart toggle, mirroring IdlingGameCard's
// layout (thumbnail + name + a single icon-only action button) but for favorite membership
// instead of idle state.
export const FavoriteGameCard = ({
  game,
  isFavorited,
  isPending,
  onToggle,
}: FavoriteGameCardProps) => {
  const { t } = useTranslation()
  const displayName = game.name ?? t('dashboard.games.unknownName', { appId: game.appId })

  return (
    <div className='group flex flex-col gap-2'>
      <GameThumbnail appId={game.appId} name={displayName} />
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <Typography
            className='transition-colors duration-150 group-hover:text-foreground'
            color='muted'
            title={displayName}
            truncate
            type='body-sm'
            weight='semibold'
          >
            {displayName}
          </Typography>
        </div>
        <Button
          isIconOnly
          aria-label={
            isFavorited ? `Remove ${displayName} from favorites` : `Add ${displayName} to favorites`
          }
          isPending={isPending}
          size='sm'
          variant='ghost'
          onPress={onToggle}
        >
          {isFavorited ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
        </Button>
      </div>
    </div>
  )
}
