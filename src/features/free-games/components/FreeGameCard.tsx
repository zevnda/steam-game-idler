import type { FreeGameClaimOutcome, FreeGameEntry } from '../types'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Button } from '@heroui/react'
import { GamePosterCard } from '@/shared/components/GamePosterCard'

interface FreeGameCardProps {
  game: FreeGameEntry
  isPending: boolean
  outcome: FreeGameClaimOutcome | undefined
  errorCode: string | undefined
  onClaim: () => void
}

export const FreeGameCard = ({
  game,
  isPending,
  outcome,
  errorCode,
  onClaim,
}: FreeGameCardProps) => {
  const { t } = useTranslation()
  const isGranted = outcome?.outcome === 'granted'

  return (
    <GamePosterCard
      actions={
        <Button
          className='w-full'
          isDisabled={isGranted}
          isPending={isPending}
          size='sm'
          variant={isGranted ? 'ghost' : undefined}
          onPress={onClaim}
        >
          {t(
            isGranted ? 'dashboard.freeGames.actions.claimed' : 'dashboard.freeGames.actions.claim',
          )}
        </Button>
      }
      appId={game.appId}
      hasContextMenu={false}
      isAlwaysRevealed
      isSelected={isGranted}
      meta={
        outcome?.outcome === 'alreadyOwned' ? (
          t('dashboard.freeGames.outcomes.alreadyOwned')
        ) : outcome?.outcome === 'failed' || errorCode ? (
          <span className='text-danger'>
            {errorCode
              ? t(errorMessageKey(errorCode), { code: errorCode })
              : t('dashboard.freeGames.errors.claimFailed')}
          </span>
        ) : undefined
      }
      name={game.name}
    />
  )
}
