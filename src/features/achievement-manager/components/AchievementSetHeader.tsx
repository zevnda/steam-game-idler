import type { AchievementSection } from '../utils/groupAchievements'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronDown, TbPuzzle, TbShoppingCartX, TbTrophy } from 'react-icons/tb'
import { DlcBadge } from './DlcBadge'
import { Button, cn, ProgressBar, Typography } from '@heroui/react'
import Image from 'next/image'

// Border + tint of a set's panel, shared by this header and every row AchievementsList.tsx draws
// inside the same panel so the slices line up into one shape. Violet for DLC (Steam's own DLC-set
// color), accent for the base game, neutral for any other developer-defined set (e.g. TF2's
// per-class sets) - and neutral too for a DLC set the account doesn't own, so the sets a user can't
// act on recede instead of competing with the ones they can.
//
// The fill is deliberately opaque - an alpha tint let AchievementManagerOverlay.tsx's hero art show
// through the panel and read as washed out. Instead it's the theme's `--background` (darker than
// the `bg-surface` achievement cards, so the panel reads as their container) with a little of the
// set color mixed in. Built from theme variables, so it follows every theme preset.
export const setPanelClasses = (section: AchievementSection) =>
  section.isUnownedDlc
    ? 'border-border bg-background'
    : section.group?.dlcAppId !== undefined
      ? 'border-violet-500/45 bg-[color-mix(in_oklch,var(--background)_88%,var(--color-violet-500))]'
      : section.group
        ? 'border-border bg-background'
        : 'border-accent/45 bg-[color-mix(in_oklch,var(--background)_88%,var(--accent))]'

interface AchievementSetHeaderProps {
  section: AchievementSection
  isCollapsed: boolean
  onToggle: () => void
}

// One Steam Achievement Set's header in AchievementsList.tsx - our take on Steam's own collapsible
// "Base Game" / "DLC: ..." set rows, restyled to this app's card language instead. A DLC set shows
// its DLC's store header art (same CDN path GameThumbnail.tsx uses, keyed by the DLC's own app id),
// falling back to an icon tile if that image 404s. Progress counts the whole set, never the
// filtered view (see AchievementSection's doc comment).
//
// Deliberately *not* card-shaped like AchievementRow: it's the top of a tinted, bordered panel
// that wraps the set's achievements (AchievementsList.tsx draws the rest of that panel row by row,
// since a virtualized list can't wrap rows in one real container element), so which achievements
// belong to which set reads from the outline alone.
//
// The whole header toggles on click for a big mouse target, but the real accessible control is the
// chevron Button (aria-expanded) - the header itself can't also be a <button>, since that chevron
// Button would then be nested inside it.
export const AchievementSetHeader = ({
  section,
  isCollapsed,
  onToggle,
}: AchievementSetHeaderProps) => {
  const { t } = useTranslation()
  const [imageFailed, setImageFailed] = useState(false)
  const { group, unlocked, total } = section
  const name = group ? group.name : t('dashboard.achievements.sets.baseGame')
  const dlcAppId = group?.dlcAppId
  const isComplete = unlocked === total
  const progressLabel = t('dashboard.achievements.unlockedCount', { unlocked, total })
  const FallbackIcon = group ? TbPuzzle : TbTrophy

  return (
    <div
      className={cn(
        'flex h-full cursor-pointer items-center gap-3 border px-3 duration-150',
        setPanelClasses(section),
        // Expanded, this is only the panel's top edge - AchievementsList.tsx's rows draw its sides
        // and the set's last row closes it. Collapsed, it's the whole (closed) panel.
        isCollapsed ? 'rounded-xl' : 'rounded-t-xl border-b-0',
      )}
      // Skip clicks that came from the chevron Button - its own onPress already toggled, and
      // letting the click bubble here too would toggle straight back.
      onClick={event => {
        if (!(event.target as Element).closest('button')) onToggle()
      }}
    >
      {dlcAppId && !imageFailed ? (
        <Image
          alt=''
          className={cn(
            'h-10 w-21 shrink-0 rounded-md object-cover',
            section.isUnownedDlc && 'grayscale',
          )}
          height={40}
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${dlcAppId}/header.jpg`}
          width={84}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-tertiary'>
          <FallbackIcon className={isComplete ? 'text-amber-400' : 'text-muted'} fontSize={20} />
        </div>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex min-w-0 items-center gap-2'>
          {dlcAppId !== undefined && <DlcBadge />}
          {section.isUnownedDlc && (
            <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-muted'>
              <TbShoppingCartX fontSize={11} />
              {t('dashboard.achievements.sets.notOwned')}
            </span>
          )}
          <Typography
            truncate
            className='min-w-0'
            color={section.isUnownedDlc ? 'muted' : undefined}
            title={name}
            type='body-sm'
            weight='semibold'
          >
            {name}
          </Typography>
        </div>
        <div className='flex min-w-0 items-center gap-2'>
          <Typography className='whitespace-nowrap' color='muted' type='body-xs'>
            {progressLabel}
          </Typography>
          <ProgressBar
            aria-label={progressLabel}
            className='max-w-60 flex-1'
            maxValue={total || 1}
            minValue={0}
            value={unlocked}
          >
            <ProgressBar.Track className='h-1.5'>
              <ProgressBar.Fill className={cn(isComplete && 'bg-amber-400')} />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      </div>

      <Button
        isIconOnly
        aria-expanded={!isCollapsed}
        aria-label={name}
        size='sm'
        variant='ghost'
        onPress={onToggle}
      >
        <TbChevronDown className={cn('duration-150', isCollapsed && '-rotate-90')} fontSize={18} />
      </Button>
    </div>
  )
}
