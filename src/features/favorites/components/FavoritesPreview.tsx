import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'
import { PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'
import { PREVIEW_GAMES } from '@/shared/utils/previewGameArt'

const CARDS = [PREVIEW_GAMES.schedule1, PREVIEW_GAMES.repo, PREVIEW_GAMES.expedition33]
const REVEALED_CARD_INDEX = 1

// The Favorites tab with games on it, for its empty-state banner.
export const FavoritesPreview = () => {
  const { t } = useTranslation()

  return (
    <PageBannerPreview count={CARDS.length} title={t('dashboard.sidebar.nav.favorites')}>
      {CARDS.map((game, index) => (
        <GamePosterCard
          key={game.appId}
          {...game}
          actions={
            <GamePosterAction aria-label={t('common.actions.clear')}>
              <TbX fontSize={16} />
            </GamePosterAction>
          }
          hasContextMenu={false}
          isAlwaysRevealed={index === REVEALED_CARD_INDEX}
        />
      ))}
    </PageBannerPreview>
  )
}
