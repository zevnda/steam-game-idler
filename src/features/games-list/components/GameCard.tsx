import type { OwnedGame } from '../types'
import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbTrophyFilled } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'
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
    <GamePosterCard
      showStats
      actions={
        <>
          <GamePosterAction
            aria-label={isIdling ? `Stop idling ${displayName}` : `Start idling ${displayName}`}
            isPending={isIdlePending}
            onPress={onToggleIdle}
          >
            {isIdling ? <TbPlayerStopFilled fontSize={16} /> : <TbPlayerPlayFilled fontSize={16} />}
          </GamePosterAction>
          <GamePosterAction
            aria-label={`Open achievements for ${displayName}`}
            onPress={() => openAchievementManager(game.appId, displayName)}
          >
            <TbTrophyFilled fontSize={16} />
          </GamePosterAction>
        </>
      }
      appId={game.appId}
      badge={isIdling && idleStartTime !== undefined && <IdleTimer startTime={idleStartTime} />}
      name={displayName}
    />
  )
}
