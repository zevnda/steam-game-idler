import { useTranslation } from 'react-i18next'
import { TbPlayerPlayFilled, TbX } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'
import { PREVIEW_GAMES } from '@/shared/utils/previewGameArt'

const CARDS = [
  PREVIEW_GAMES.monsterHunterWilds,
  PREVIEW_GAMES.helldivers2,
  PREVIEW_GAMES.hollowKnight,
]
const REVEALED_CARD_INDEX = 1

// The Queue tab with games on it, for its empty-state banner.
export const AutoIdleQueuePreview = () => {
  const { t } = useTranslation()

  return (
    <PageBannerPreview
      action={
        <Button size='sm' variant='primary'>
          <TbPlayerPlayFilled fontSize={14} />
          {t('common.actions.start')}
        </Button>
      }
      count={CARDS.length}
      title={t('common.tabs.queue')}
    >
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
