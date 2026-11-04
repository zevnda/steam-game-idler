import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TbClockHour4, TbTrophyFilled } from 'react-icons/tb'
import { cn } from '@heroui/react'
import { useGamesListStore } from '@/shared/stores/gamesListStore'

interface GameStatChipsProps {
  appId: number
  // The top-left corner is left free when the card already has something there
  showPlaytime: boolean
  // A selected card's checkmark takes the top-right corner instead
  isSelected: boolean
}

const CHIP_CLASSNAME =
  'absolute top-1.5 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-px text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm'

// One small chip in a card's top corner. `label` is the full wording for screen readers and the
// hover tooltip, since the chip itself only shows an icon and a number.
export const GameChip = ({
  corner,
  label,
  className,
  children,
}: {
  corner: 'left' | 'right'
  label?: string
  className?: string
  children: ReactNode
}) => (
  <span
    aria-label={label}
    className={cn(CHIP_CLASSNAME, corner === 'left' ? 'left-1.5' : 'right-1.5', className)}
    role={label ? 'img' : undefined}
    title={label}
  >
    {children}
  </span>
)

// `Intl` rather than translation strings, so the unit follows the app's language for free
const formatPlaytime = (minutes: number, locale: string) =>
  minutes < 60
    ? new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'minute',
        unitDisplay: 'narrow',
      }).format(minutes)
    : new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'hour',
        unitDisplay: 'narrow',
        maximumFractionDigits: minutes < 600 ? 1 : 0,
      }).format(minutes / 60)

export const PlaytimeChip = ({ minutes }: { minutes: number }) => {
  const { i18n } = useTranslation()
  if (minutes <= 0) return null
  return (
    <GameChip corner='left'>
      <TbClockHour4 aria-hidden fontSize={11} />
      {formatPlaytime(minutes, i18n.language)}
    </GameChip>
  )
}

// Stat chips on game cards - playtime top-left, achievements top-right. Looked up from the games
// list by app ID rather than passed in, so it works for list entries that only carry an ID and a
// name (favorites, the auto-idle queue). Each chip is hidden when it has nothing to say: no
// playtime yet, a game without achievements, or achievement counts that haven't loaded (Local
// Sign-in only gets them with the user's own Steam Web API key).
export const GameStatChips = ({ appId, showPlaytime, isSelected }: GameStatChipsProps) => {
  const game = useGamesListStore(state => state.games.find(g => g.appId === appId))
  if (!game) return null

  const playtime = game.playtimeForeverMinutes
  const unlocked = game.achievementsUnlocked
  const total = game.achievementsTotal
  const hasAchievements = unlocked !== null && total !== null && total > 0
  const isComplete = hasAchievements && unlocked >= total

  return (
    <>
      {showPlaytime && <PlaytimeChip minutes={playtime} />}
      {!isSelected && hasAchievements && (
        <GameChip className={cn(isComplete && 'text-[#ffc700]')} corner='right'>
          <TbTrophyFilled aria-hidden fontSize={10} />
          {unlocked}/{total}
        </GameChip>
      )}
    </>
  )
}
