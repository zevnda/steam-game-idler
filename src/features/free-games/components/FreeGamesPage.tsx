import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TbGift } from 'react-icons/tb'
import { useClaimFreeGame } from '../hooks/useClaimFreeGame'
import { useFreeGames } from '../hooks/useFreeGames'
import { errorMessageKey } from '../utils/errorMessageKey'
import { FreeGamesGrid } from './FreeGamesGrid'
import { FreeGamesPageHeader } from './FreeGamesPageHeader'
import { Alert, Button, EmptyState, Typography } from '@heroui/react'
import { useRouter } from 'next/router'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { useSessionStore } from '@/shared/stores/sessionStore'

// Claimable free games - discovery (get_free_games) is a public, mode-agnostic scrape with no
// account concept, already filtered here against this account's owned games (useFreeGames reuses
// games-list's useGamesList rather than a second ownership fetch, same reuse pattern idling
// established). Claiming genuinely differs per sign-in mode server-side (see
// src-tauri/src/free_games/mod.rs's doc comment) but the frontend never branches on that itself -
// one claim_free_game command handles it.
export const FreeGamesPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const { freeGames, isLoading, isRefreshing, errorCode, refresh, removeClaimed } = useFreeGames()
  const { pendingAppIds, outcomes, errorCodes, claim } = useClaimFreeGame(removeClaimed)

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  if (!account) {
    return null
  }

  return (
    <div className='flex h-full flex-col'>
      <FreeGamesPageHeader
        gameCount={freeGames.length}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
      />

      {isLoading ? (
        <GameGridSkeleton />
      ) : errorCode ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
          <Alert className='max-w-md' status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('dashboard.freeGames.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(errorMessageKey(errorCode), { code: errorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <Button variant='secondary' onPress={refresh}>
            {t('common.actions.tryAgain')}
          </Button>
        </div>
      ) : freeGames.length === 0 ? (
        <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
          <TbGift fontSize={40} />
          <Typography type='h3'>{t('dashboard.freeGames.empty.title')}</Typography>
          <Typography color='muted' type='body-sm'>
            {t('dashboard.freeGames.empty.description')}
          </Typography>
        </EmptyState>
      ) : (
        <div className='flex-1 overflow-y-auto'>
          <FreeGamesGrid
            errorCodes={errorCodes}
            games={freeGames}
            outcomes={outcomes}
            pendingAppIds={pendingAppIds}
            onClaim={claim}
          />
        </div>
      )}
    </div>
  )
}
