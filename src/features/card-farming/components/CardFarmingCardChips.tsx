import type { GameWithDrops } from '../types'
import { useTranslation } from 'react-i18next'
import { TbCards } from 'react-icons/tb'
import { GameChip, PlaytimeChip } from '@/shared/components/GameStatChips'
import { useGamesListStore } from '@/shared/stores/gamesListStore'

interface CardFarmingCardChipsProps {
  appId: number
  // The game's drops entry, when it has one: only while the game still has drops remaining.
  drops: GameWithDrops | undefined
  // The whitelist checkmark takes the drops chip's corner instead
  isSelected?: boolean
}

// Playtime and cards remaining on every Card Farming card, like the other pages' stat chips
// (see GameStatChips). Playtime comes from the drops entry when there is one, otherwise from the
// games list, so the Whitelist and Blacklist tabs show it too.
export const CardFarmingCardChips = ({ appId, drops, isSelected }: CardFarmingCardChipsProps) => {
  const { t } = useTranslation()
  const libraryMinutes = useGamesListStore(
    state => state.games.find(game => game.appId === appId)?.playtimeForeverMinutes,
  )
  const minutes = drops ? Math.round(drops.playtimeHours * 60) : (libraryMinutes ?? 0)

  return (
    <>
      <PlaytimeChip minutes={minutes} />
      {drops && !isSelected && (
        <GameChip
          corner='right'
          label={t('dashboard.cardFarming.progress.dropsRemaining', { count: drops.remaining })}
        >
          <TbCards aria-hidden fontSize={11} />
          {drops.remaining}
        </GameChip>
      )}
    </>
  )
}
