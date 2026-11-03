import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbRefresh, TbTrophyFilled } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { PageBanner, PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'
import { PREVIEW_GAMES } from '@/shared/utils/previewGameArt'

const CARDS = [PREVIEW_GAMES.vampireSurvivors, PREVIEW_GAMES.dispatch, PREVIEW_GAMES.portal2]
const REVEALED_CARD_INDEX = 1

const NoGamesPreview = () => {
  const { t } = useTranslation()

  return (
    <PageBannerPreview count={CARDS.length} title={t('common.tabs.allGames')}>
      {CARDS.map((game, index) => (
        <GamePosterCard
          key={game.appId}
          {...game}
          actions={
            <>
              <GamePosterAction aria-label={t('common.gameCardMenu.startIdling')}>
                <TbPlayerPlayFilled fontSize={16} />
              </GamePosterAction>
              <GamePosterAction aria-label={t('common.gameCardMenu.manageAchievements')}>
                <TbTrophyFilled fontSize={16} />
              </GamePosterAction>
            </>
          }
          hasContextMenu={false}
          isAlwaysRevealed={index === REVEALED_CARD_INDEX}
          knownArtSrc={game.knownArtSrc}
        />
      ))}
    </PageBannerPreview>
  )
}

interface NoGamesBannerProps {
  isRefreshing?: boolean
  onRefresh: () => void
}

// The account's library itself is empty. Shared by every page listing the whole library: Games, and
// the All Games tabs on Favorites, Auto Idle and Achievement Unlocker.
export const NoGamesBanner = ({ isRefreshing, onRefresh }: NoGamesBannerProps) => {
  const { t } = useTranslation()

  return (
    <PageBanner
      actions={
        <Button
          className='bg-white text-black hover:bg-white/85'
          isPending={isRefreshing}
          onPress={onRefresh}
        >
          <TbRefresh fontSize={18} />
          {t('common.actions.refresh')}
        </Button>
      }
      art={<NoGamesPreview />}
      description={t('dashboard.games.empty.description')}
      title={t('dashboard.games.empty.title')}
    />
  )
}
