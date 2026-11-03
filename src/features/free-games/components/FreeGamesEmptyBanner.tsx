import { useTranslation } from 'react-i18next'
import { TbRefresh, TbSettings } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { PageBanner, PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { GamePosterCard } from '@/shared/components/GamePosterCard'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { PREVIEW_GAMES } from '@/shared/utils/previewGameArt'

// These only illustrate what a free game looks like on this page, not a claim that any of them is
// free right now.
const CARDS = [PREVIEW_GAMES.marvelRivals, PREVIEW_GAMES.hades2, PREVIEW_GAMES.balatro]
// Shows the page's other card state, so the preview explains what claiming leads to.
const CLAIMED_CARD_INDEX = 1

const FreeGamesPreview = () => {
  const { t } = useTranslation()

  return (
    <PageBannerPreview count={CARDS.length} title={t('dashboard.sidebar.nav.freeGames')}>
      {CARDS.map((game, index) => {
        const isClaimed = index === CLAIMED_CARD_INDEX
        return (
          <GamePosterCard
            key={game.appId}
            actions={
              <Button className='w-full' size='sm' variant={isClaimed ? 'ghost' : undefined}>
                {t(
                  isClaimed
                    ? 'dashboard.freeGames.actions.claimed'
                    : 'dashboard.freeGames.actions.claim',
                )}
              </Button>
            }
            appId={game.appId}
            hasContextMenu={false}
            isAlwaysRevealed
            isSelected={isClaimed}
            knownArtSrc={game.knownArtSrc}
            name={game.name}
          />
        )
      })}
    </PageBannerPreview>
  )
}

interface FreeGamesEmptyBannerProps {
  isRefreshing: boolean
  onRefresh: () => void
}

export const FreeGamesEmptyBanner = ({ isRefreshing, onRefresh }: FreeGamesEmptyBannerProps) => {
  const { t } = useTranslation()
  const openSettings = useSettingsModalStore(state => state.open)

  return (
    <PageBanner
      actions={
        <>
          <Button
            className='bg-white text-black hover:bg-white/85'
            isPending={isRefreshing}
            onPress={onRefresh}
          >
            <TbRefresh fontSize={18} />
            {t('common.actions.refresh')}
          </Button>
          <Button variant='secondary' onPress={() => openSettings('freeGames')}>
            <TbSettings fontSize={18} />
            {t('common.actions.settings')}
          </Button>
        </>
      }
      art={<FreeGamesPreview />}
      description={t('dashboard.freeGames.empty.description')}
      title={t('dashboard.freeGames.empty.title')}
    />
  )
}
