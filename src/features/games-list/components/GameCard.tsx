import type { OwnedGame } from '../types'
import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbTrophyFilled } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { IdleTimer } from '@/shared/components/IdleTimer'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'

interface GameCardProps {
  game: OwnedGame
  isIdling: boolean
  isIdlePending: boolean
  idleStartTime: number | undefined
  onToggleIdle: () => void
}

// Idle controls live directly on this card (matching `main`'s GameCard), not on a separate
// "start idling" page - the idling feature's own page is now a filtered, view-only list of
// whichever games these controls have started (see IdlingPage), mirroring `main`'s split between
// "where idling starts" (the games list) and "what's currently idling" (the idling page). This is
// also still the one place that opens the achievement-manager overlay, since games-list is the
// one page guaranteed to list every owned game (idling/favorites are subsets).
export const GameCard = ({
  game,
  isIdling,
  isIdlePending,
  idleStartTime,
  onToggleIdle,
}: GameCardProps) => {
  const { t } = useTranslation()
  const openAchievementManager = useAchievementManagerStore(state => state.open)
  const displayName = game.name ?? t('dashboard.games.unknownName', { appId: game.appId })

  return (
    <div className='group flex flex-col gap-2'>
      <GameThumbnail appId={game.appId} name={displayName}>
        {isIdling && idleStartTime !== undefined && <IdleTimer startTime={idleStartTime} />}
      </GameThumbnail>
      <div className='flex items-center justify-between gap-2'>
        <Typography
          className='min-w-0 transition-colors duration-150 group-hover:text-foreground'
          color='muted'
          title={displayName}
          truncate
          type='body-sm'
          weight='semibold'
        >
          {displayName}
        </Typography>
        <div className='flex shrink-0 items-center gap-1'>
          <Button
            isIconOnly
            aria-label={isIdling ? `Stop idling ${displayName}` : `Start idling ${displayName}`}
            isPending={isIdlePending}
            size='sm'
            variant='ghost'
            onPress={onToggleIdle}
          >
            {isIdling ? <TbPlayerStopFilled fontSize={16} /> : <TbPlayerPlayFilled fontSize={16} />}
          </Button>
          <Button
            isIconOnly
            aria-label={`Open achievements for ${displayName}`}
            size='sm'
            variant='ghost'
            onPress={() => openAchievementManager(game.appId, displayName)}
          >
            <TbTrophyFilled fontSize={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
