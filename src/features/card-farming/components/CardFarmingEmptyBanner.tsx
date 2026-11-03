import { useTranslation } from 'react-i18next'
import { TbBan, TbCards, TbPlus, TbSettings } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { PageBanner, PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { PREVIEW_GAMES } from '@/shared/utils/previewGameArt'

const CARDS = [PREVIEW_GAMES.palworld, PREVIEW_GAMES.balatro, PREVIEW_GAMES.silksong]
const REVEALED_CARD_INDEX = 1
const PREVIEW_DROPS = [4, 2, 3]

type CardFarmingEmptyVariant = 'browse' | 'whitelist' | 'blacklist'

// The Games With Drops tab with games on it, which is where all three empty tabs are filled from. The
// whitelist variant marks a card as added, since that's what would land a game on that tab.
const GamesWithDropsPreview = ({ variant }: { variant: CardFarmingEmptyVariant }) => {
  const { t } = useTranslation()

  return (
    <PageBannerPreview count={CARDS.length} title={t('dashboard.cardFarming.tabs.gamesWithDrops')}>
      {CARDS.map((game, index) => (
        <GamePosterCard
          key={game.appId}
          {...game}
          actions={
            <>
              <GamePosterAction aria-label={t('dashboard.cardFarming.tabs.whitelisted')}>
                <TbPlus fontSize={16} />
              </GamePosterAction>
              <GamePosterAction aria-label={t('dashboard.cardFarming.tabs.blacklisted')}>
                <TbBan fontSize={16} />
              </GamePosterAction>
            </>
          }
          hasContextMenu={false}
          isAlwaysRevealed={index === REVEALED_CARD_INDEX}
          isSelected={variant === 'whitelist' && index === 0}
          meta={t('dashboard.cardFarming.progress.dropsRemaining', { count: PREVIEW_DROPS[index] })}
        />
      ))}
    </PageBannerPreview>
  )
}

interface CardFarmingEmptyBannerProps {
  variant: CardFarmingEmptyVariant
  onBrowseGames: () => void
}

// One banner for the page's three tabs. Whitelist and blacklist are filled from Games With Drops, so
// they send the user there. With no drops left there's nowhere to send them, so that one offers the
// page's settings instead.
export const CardFarmingEmptyBanner = ({ variant, onBrowseGames }: CardFarmingEmptyBannerProps) => {
  const { t } = useTranslation()
  const openSettings = useSettingsModalStore(state => state.open)

  const text = {
    browse: {
      title: t('dashboard.cardFarming.browseEmpty.title'),
      description: t('dashboard.cardFarming.browseEmpty.description'),
    },
    whitelist: {
      title: t('dashboard.cardFarming.whitelistEmpty.title'),
      description: t('dashboard.cardFarming.whitelistEmpty.description'),
    },
    blacklist: {
      title: t('dashboard.cardFarming.blacklistEmpty.title'),
      description: t('dashboard.cardFarming.blacklistEmpty.description'),
    },
  }[variant]

  return (
    <PageBanner
      actions={
        variant === 'browse' ? (
          <Button
            className='bg-white text-black hover:bg-white/85'
            onPress={() => openSettings('cardFarming')}
          >
            <TbSettings fontSize={18} />
            {t('common.actions.settings')}
          </Button>
        ) : (
          <Button className='bg-white text-black hover:bg-white/85' onPress={onBrowseGames}>
            <TbCards fontSize={18} />
            {t('dashboard.cardFarming.tabs.gamesWithDrops')}
          </Button>
        )
      }
      art={<GamesWithDropsPreview variant={variant} />}
      description={text.description}
      title={text.title}
    />
  )
}
