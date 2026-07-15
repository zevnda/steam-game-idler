import type { OwnedGame } from '@/features/games-list/types'
import { useTranslation } from 'react-i18next'
import { TbPlayerStopFilled } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameCard } from '@/features/games-list/components/GameCard'

interface IdlingSectionProps {
  title: string
  games: OwnedGame[]
  startTimes: Record<number, number>
  pendingAppIds: Set<number>
  onToggle: (appId: number) => void
  onStop?: () => void
  isStopping?: boolean
}

// One owner's group of currently-idling games on the Idling page - a plain (non-virtualized) CSS
// grid, not `VirtualizedGameGrid`: idling as a whole is capped at 32 games total across every
// owner combined (`idling::MAX_CONCURRENT_GAMES`), so no section can ever grow large enough to
// need virtualization. Every game rendered here is, by construction, idling
// (`groupIdlingGames` only ever puts idling app ids into a group), so `isIdling` is always `true`.
export const IdlingSection = ({
  title,
  games,
  startTimes,
  pendingAppIds,
  onToggle,
  onStop,
  isStopping,
}: IdlingSectionProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-baseline gap-2'>
          <Typography type='body-sm' className='font-semibold'>
            {title}
          </Typography>
          <Typography type='body-sm' color='muted'>
            {t('dashboard.idling.count', { count: games.length })}
          </Typography>
        </div>
        {onStop && (
          <Button size='sm' variant='danger' isPending={isStopping} onPress={onStop}>
            <TbPlayerStopFilled fontSize={16} />
            {t('common.actions.stop')}
          </Button>
        )}
      </div>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
        {games.map(game => (
          <GameCard
            key={game.appId}
            game={game}
            idleStartTime={startTimes[game.appId]}
            isIdlePending={pendingAppIds.has(game.appId)}
            isIdling
            onToggleIdle={() => onToggle(game.appId)}
          />
        ))}
      </div>
    </div>
  )
}
