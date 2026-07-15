import type { OwnedGame } from '@/features/games-list/types'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbPlus } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface AchievementUnlockerGameCardProps {
  game: OwnedGame
  isQueued: boolean
  isPending: boolean
  onToggle: () => void
}

// Used in the "All Games" tab - mirrors FavoriteGameCard's shape (thumbnail + name + a single
// icon-only toggle button), swapping the heart for an award icon for queue membership instead of
// favorite membership.
export const AchievementUnlockerGameCard = ({
  game,
  isQueued,
  isPending,
  onToggle,
}: AchievementUnlockerGameCardProps) => {
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
          aria-label={isQueued ? `Remove ${displayName}` : `Add ${displayName}`}
          isPending={isPending}
          size='sm'
          variant='ghost'
          onPress={onToggle}
        >
          {isQueued ? <TbCheck fontSize={16} /> : <TbPlus fontSize={16} />}
        </Button>
      </div>
    </div>
  )
}
