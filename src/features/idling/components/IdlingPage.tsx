import type { TranslationKey } from '@/i18n'
import type { IdleOwner } from '../types'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TbPlayerPlay } from 'react-icons/tb'
import { useIdling } from '../hooks/useIdling'
import { groupIdlingGames } from '../utils/groupIdlingGames'
import { IdlingPageHeader } from './IdlingPageHeader'
import { IdlingSection } from './IdlingSection'
import { Alert, Button, EmptyState, Skeleton, Typography } from '@heroui/react'
import { useRouter } from 'next/router'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { errorMessageKey as gamesErrorMessageKey } from '@/features/games-list/utils/errorMessageKey'
import { BackToTopButton } from '@/shared/components/BackToTopButton'
import { useBackToTop } from '@/shared/hooks/useBackToTop'
import { useSessionStore } from '@/shared/stores/sessionStore'

// Section titles reuse the sidebar's existing feature-name keys where one already exists -
// "manual"/"other" have no equivalent elsewhere, so those get their own keys.
const SECTION_TITLE_KEY: Record<IdleOwner | 'other', TranslationKey> = {
  manual: 'dashboard.idling.sections.manual',
  card_farming: 'dashboard.sidebar.nav.cardFarming',
  achievement_unlocker: 'dashboard.sidebar.nav.achievementUnlocker',
  auto_idle: 'dashboard.sidebar.nav.autoIdle',
  other: 'dashboard.idling.sections.other',
}

// Grouped-by-feature list of whatever's currently idling, plus a "stop all" action and a
// per-section "stop" - see groupIdlingGames.ts for the grouping/precedence rules. Starting/
// stopping an individual game happens from its GameCard on the games-list page (games-list's
// GamesPage owns the same `useIdling` hook); this page only filters the owned games down to the
// ones already idling and reuses that same GameCard so an individual game can still be stopped
// from here too. Still needs `useGamesList` for names/header images to resolve each idling app id
// against - idlingStore only tracks app ids, not game details.
export const IdlingPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const { phase, games, errorCode: gamesErrorCode, refresh } = useGamesList()
  const {
    appIds,
    startTimes,
    claimsByOwner,
    pendingAppIds,
    isStoppingAll,
    pendingOwners,
    toggleIdle,
    stopAll,
    stopSection,
  } = useIdling(games)
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()

  useEffect(() => {
    // Same as GamesPage: nothing in this rewrite yet persists "who's signed in" across a page
    // load that didn't just come from a sign-in flow (see sessionStore's doc comment).
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  if (!account) {
    return null
  }

  const idlingGames = games.filter(game => appIds.includes(game.appId))
  const groups = groupIdlingGames(appIds, claimsByOwner)

  return (
    <div className='flex h-full flex-col'>
      <IdlingPageHeader
        idlingCount={appIds.length}
        isStoppingAll={isStoppingAll}
        onStopAll={stopAll}
      />

      {phase === 'loading' && appIds.length > 0 ? (
        <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
          {Array.from({ length: appIds.length }, (_, index) => (
            <Skeleton key={index} className='aspect-460/215 rounded-lg' />
          ))}
        </div>
      ) : gamesErrorCode ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
          <Alert className='max-w-md' status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('dashboard.games.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(gamesErrorMessageKey(gamesErrorCode), { code: gamesErrorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <Button variant='secondary' onPress={refresh}>
            {t('common.actions.tryAgain')}
          </Button>
        </div>
      ) : idlingGames.length === 0 ? (
        <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
          <TbPlayerPlay fontSize={40} />
          <Typography type='h3'>{t('dashboard.idling.empty.title')}</Typography>
          <Typography color='muted' type='body-sm'>
            {t('dashboard.idling.empty.description')}
          </Typography>
        </EmptyState>
      ) : (
        <div
          ref={setScrollElement}
          className='relative flex flex-1 flex-col gap-6 overflow-y-auto p-6'
        >
          {groups.map(group => {
            const groupGameIds = new Set(group.appIds)
            const groupGames = idlingGames.filter(game => groupGameIds.has(game.appId))
            // The "other" fallback bucket has no single owner to stop (see groupIdlingGames.ts) -
            // no per-section stop button for it, only the global "Stop All" above still covers it.
            const owner = group.owner === 'other' ? undefined : group.owner
            return (
              <IdlingSection
                key={group.owner}
                title={t(SECTION_TITLE_KEY[group.owner])}
                games={groupGames}
                startTimes={startTimes}
                pendingAppIds={pendingAppIds}
                onToggle={toggleIdle}
                onStop={owner ? () => stopSection(owner) : undefined}
                isStopping={owner ? pendingOwners.has(owner) : false}
              />
            )
          })}
          <BackToTopButton visible={isVisible} onPress={scrollToTop} />
        </div>
      )}
    </div>
  )
}
