import type { FreeGameClaimOutcome, FreeGameEntry } from '../types'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

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
    <div className='group flex flex-col gap-2'>
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
      </div>
      {outcome?.outcome === 'alreadyOwned' && (
        <Typography color='muted' type='body-xs'>
          {t('dashboard.freeGames.outcomes.alreadyOwned')}
        </Typography>
      )}
      {(outcome?.outcome === 'failed' || errorCode) && (
        <Typography className='text-danger' type='body-xs'>
          {errorCode
            ? t(errorMessageKey(errorCode), { code: errorCode })
            : t('dashboard.freeGames.errors.claimFailed')}
        </Typography>
      )}
    </div>
  )
}
