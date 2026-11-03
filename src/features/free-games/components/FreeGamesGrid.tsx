import type { FreeGameClaimOutcome, FreeGameEntry } from '../types'
import { FreeGameCard } from './FreeGameCard'

interface FreeGamesGridProps {
  games: FreeGameEntry[]
  pendingAppIds: Set<number>
  outcomes: Record<number, FreeGameClaimOutcome>
  errorCodes: Record<number, string>
  onClaim: (appId: number) => void
}

export const FreeGamesGrid = ({
  games,
  pendingAppIds,
  outcomes,
  errorCodes,
  onClaim,
}: FreeGamesGridProps) => {
  return (
    <div className='game-grid p-6'>
      {games.map(game => (
        <FreeGameCard
          key={game.appId}
          errorCode={errorCodes[game.appId]}
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          outcome={outcomes[game.appId]}
          onClaim={() => onClaim(game.appId)}
        />
      ))}
    </div>
  )
}
