import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TbRefresh, TbSettings } from 'react-icons/tb'
import { useClaimFreeGame } from '../hooks/useClaimFreeGame'
import { useFreeGames } from '../hooks/useFreeGames'
import { errorMessageKey } from '../utils/errorMessageKey'
import { FreeGamesEmptyBanner } from './FreeGamesEmptyBanner'
import { FreeGamesGrid } from './FreeGamesGrid'
import { Alert, Button } from '@heroui/react'
import { useRouter } from 'next/router'
import { PageBannerArea } from '@/shared/components/dashboard/PageBanner'
import { PageBody } from '@/shared/components/dashboard/PageBody'
import { PageTitle, PageToolbar } from '@/shared/components/dashboard/PageToolbar'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

// Claimable free games - discovery (get_free_games) is a public, mode-agnostic scrape with no
// account concept, already filtered here against this account's owned games (useFreeGames reuses
// games-list's useGamesList rather than a second ownership fetch, same reuse pattern idling
// established). Claiming genuinely differs per sign-in mode server-side (see
// src-tauri/src/free_games/mod.rs's doc comment) but the frontend never branches on that itself -
// one claim_free_game command handles it.
export const FreeGamesPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const openSettings = useSettingsModalStore(state => state.open)
  const account = useSessionStore(state => state.account)
  const { freeGames, isLoading, isRefreshing, errorCode, refresh } = useFreeGames()
  const { pendingAppIds, outcomes, errorCodes, claim } = useClaimFreeGame()

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  if (!account) {
    return null
  }

  // The banner carries its own refresh and settings buttons, so there's no toolbar above it.
  const isEmpty = !isLoading && !errorCode && freeGames.length === 0

  return (
    <div className='flex h-full flex-col'>
      <PageBody>
        {!isEmpty && (
          <PageToolbar
            start={
              freeGames.length > 0 && (
                <PageTitle count={freeGames.length} title={t('dashboard.sidebar.nav.freeGames')} />
              )
            }
          >
            <Button
              isIconOnly
              aria-label={t('common.actions.refresh')}
              isPending={isRefreshing}
              variant='secondary'
              onPress={refresh}
            >
              <TbRefresh fontSize={18} />
            </Button>
            <Button
              isIconOnly
              aria-label={t('common.actions.settings')}
              variant='secondary'
              onPress={() => openSettings('freeGames')}
            >
              <TbSettings fontSize={18} />
            </Button>
          </PageToolbar>
        )}

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
        ) : isEmpty ? (
          <PageBannerArea>
            <FreeGamesEmptyBanner isRefreshing={isRefreshing} onRefresh={refresh} />
          </PageBannerArea>
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
      </PageBody>
    </div>
  )
}
