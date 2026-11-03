import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbDeviceGamepad2, TbPlayerStopFilled, TbTrophyFilled } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { useRouter } from 'next/router'
import { PageBanner, PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'
import { IdleTimer } from '@/shared/components/IdleTimer'
import { PREVIEW_GAMES } from '@/shared/utils/previewGameArt'

const MINUTE_MS = 60 * 1000
// Each has a different duration so the timers don't tick in step. PEAK's in the middle since it's the
// card showing its overlay, and its logo sits at the top of its art, above that overlay.
const CARDS = [
  { ...PREVIEW_GAMES.palworld, idleDurationMs: 134 * MINUTE_MS },
  { ...PREVIEW_GAMES.peak, idleDurationMs: 47 * MINUTE_MS },
  { ...PREVIEW_GAMES.silksong, idleDurationMs: 308 * MINUTE_MS },
]
// Only this card shows its hover state, so the illustration also explains where the controls live.
const REVEALED_CARD_INDEX = 1

// What this page looks like with games idling, with timers that really tick.
const IdlingPreview = () => {
  const { t } = useTranslation()
  const [mountedAt] = useState(() => Date.now())

  return (
    <PageBannerPreview
      action={
        <Button size='sm' variant='danger'>
          <TbPlayerStopFilled fontSize={14} />
          {t('common.actions.stop')}
        </Button>
      }
      count={CARDS.length}
      title={t('dashboard.sidebar.nav.idling')}
    >
      {CARDS.map((game, index) => (
        <GamePosterCard
          key={game.appId}
          actions={
            <>
              <GamePosterAction aria-label={t('common.actions.stop')}>
                <TbPlayerStopFilled fontSize={16} />
              </GamePosterAction>
              <GamePosterAction aria-label={t('common.gameCardMenu.manageAchievements')}>
                <TbTrophyFilled fontSize={16} />
              </GamePosterAction>
            </>
          }
          appId={game.appId}
          badge={<IdleTimer startTime={mountedAt - game.idleDurationMs} />}
          hasContextMenu={false}
          isAlwaysRevealed={index === REVEALED_CARD_INDEX}
          knownArtSrc={game.knownArtSrc}
          name={game.name}
        />
      ))}
    </PageBannerPreview>
  )
}

export const IdlingEmptyBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <PageBanner
      actions={
        <>
          <Button
            className='bg-white text-black hover:bg-white/85'
            onPress={() => router.push('/dashboard')}
          >
            <TbDeviceGamepad2 fontSize={18} />
            {t('dashboard.idling.empty.browseGames')}
          </Button>
          <Button variant='secondary' onPress={() => router.push('/dashboard/auto-idle')}>
            {t('dashboard.idling.empty.setUpAutoIdle')}
          </Button>
        </>
      }
      art={<IdlingPreview />}
      description={t('dashboard.idling.empty.description')}
      title={t('dashboard.idling.empty.title')}
    />
  )
}
