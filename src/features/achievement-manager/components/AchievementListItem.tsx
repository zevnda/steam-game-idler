import type { AchievementDto } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbCheck, TbLock, TbLockOpen, TbShoppingCartX } from 'react-icons/tb'
import {
  getAchievementRarityTier,
  RARITY_TIER_CLASSES,
  RARITY_TIER_LABEL_KEYS,
} from '../utils/achievementRarity'
import { DlcBadge } from './DlcBadge'
import { Button, cn, Typography } from '@heroui/react'
import Image from 'next/image'
import { AppTooltip } from '@/shared/components/AppTooltip'

// Steam only ever gives achievement icons as a bare filename (see
// libs/SteamUtility/Core/SchemaParsing/SchemaWalker.cs's `icon`/`icon_gray` fields) - this base URL
// is the CDN path that resolves one into a real image.
const ICON_BASE_URL = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'

interface AchievementListItemProps {
  achievement: AchievementDto
  appId: number
  isSelected: boolean
  isDlc: boolean
  isUnownedDlc: boolean
  isPending: boolean
  onSelectedChange: () => void
  onQuickToggle: () => void
}

// One achievement row in AchievementList.tsx: selection circle | icon | name + description |
// rarity + DLC badge | quick action. Clicking anywhere on the row selects it, staging it to flip
// until the selection bar's "Save changes"; the button at the end flips just this one right away.
// State reads from the art itself: an unlocked achievement shows its full-colour icon plus a green
// check, a locked one Steam's own greyed-out icon - no separate status text competing for attention.
//
// Not selectable: protected achievements (the game's server owns them) and still-locked achievements
// from DLC the account doesn't own (Steam rejects the unlock - see groupAchievements.ts). Both show
// an explanatory marker where the quick-action button would be, and no selection circle.
//
// The row is a `div role="checkbox"` rather than a <button> because it contains a real Button (the
// quick action), which can't be nested inside another button.
export const AchievementListItem = ({
  achievement,
  appId,
  isSelected,
  isDlc,
  isUnownedDlc,
  isPending,
  onSelectedChange,
  onQuickToggle,
}: AchievementListItemProps) => {
  const { t } = useTranslation()
  const isUnlockBlocked = isUnownedDlc && !achievement.achieved
  const isSelectable = !achievement.protectedAchievement && !isUnlockBlocked
  const icon = achievement.achieved ? achievement.iconNormal : achievement.iconLocked
  const rarityTier =
    achievement.percent !== undefined ? getAchievementRarityTier(achievement.percent) : null
  const quickActionLabel = achievement.achieved
    ? t('dashboard.achievements.actions.lock')
    : t('dashboard.achievements.actions.unlock')

  const toggleSelection = () => {
    if (isSelectable) onSelectedChange()
  }

  return (
    <div
      aria-checked={isSelected}
      aria-disabled={!isSelectable}
      aria-label={achievement.name}
      className={cn(
        'group flex h-full items-center gap-3 rounded-xl border px-3 duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent',
        isSelected
          ? 'border-accent bg-accent/10'
          : 'border-border bg-surface hover:border-surface-tertiary hover:bg-surface-secondary/50',
        isSelectable ? 'cursor-pointer' : 'cursor-default',
      )}
      role='checkbox'
      tabIndex={isSelectable ? 0 : -1}
      // Ignore clicks that came from the quick-action Button - it handles its own press.
      onClick={event => {
        if (!(event.target as Element).closest('button')) toggleSelection()
      }}
      onKeyDown={event => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          toggleSelection()
        }
      }}
    >
      {/* Selection circle - always present on selectable rows (a list, unlike the tile grid this
          replaced, has no other cue that rows are clickable), empty space otherwise so every row's
          columns still line up. */}
      <span
        aria-hidden
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border-2 duration-150',
          !isSelectable && 'invisible',
          isSelected
            ? 'border-accent bg-accent text-white'
            : 'border-surface-tertiary group-hover:border-muted',
        )}
      >
        {isSelected && <TbCheck fontSize={12} />}
      </span>

      <div className='relative shrink-0'>
        <Image
          alt=''
          className={cn(
            'rounded-lg',
            !achievement.achieved && 'opacity-70',
            isUnlockBlocked && 'grayscale',
          )}
          height={44}
          src={`${ICON_BASE_URL}${appId}/${icon}`}
          width={44}
        />
        {achievement.achieved && (
          <span className='absolute -right-1.5 -bottom-1.5 flex size-4.5 items-center justify-center rounded-full bg-success text-white ring-2 ring-surface'>
            <TbCheck fontSize={11} />
          </span>
        )}
      </div>

      <div className='flex min-w-0 flex-1 flex-col'>
        <AppTooltip.Root>
          <AppTooltip.Trigger>
            <Typography
              truncate
              color={achievement.achieved ? undefined : 'muted'}
              type='body-sm'
              weight='semibold'
            >
              {achievement.name}
            </Typography>
          </AppTooltip.Trigger>
          <AppTooltip.Content>{achievement.id}</AppTooltip.Content>
        </AppTooltip.Root>
        <Typography
          className={cn(
            'truncate',
            achievement.hidden && !achievement.achieved && 'blur-xs hover:blur-none',
          )}
          color='muted'
          title={achievement.description || undefined}
          type='body-xs'
        >
          {achievement.description || t('dashboard.achievements.noDescription')}
        </Typography>
      </div>

      <div className='flex shrink-0 items-center gap-1.5'>
        {isDlc && <DlcBadge />}
        {rarityTier && (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
              RARITY_TIER_CLASSES[rarityTier],
            )}
          >
            {achievement.percent!.toFixed(1)}% • {t(RARITY_TIER_LABEL_KEYS[rarityTier])}
          </span>
        )}
      </div>

      {/* Quick action (unlock/lock just this one, right now), or why it can't be. Always visible,
          and its colour doubles as the row's state at a glance: soft red (danger-soft, same as the
          sidebar's Lock all) = unlocked, press to lock; white (primary, same as the sidebar's Unlock
          all) = locked, press to unlock. Fixed-width slot so the rarity column
          stays aligned across rows whichever variant renders. */}
      <div className='flex w-8 shrink-0 justify-center'>
        {achievement.protectedAchievement ? (
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <span
                aria-label={t('dashboard.achievements.protectedTooltip')}
                className='flex size-8 items-center justify-center text-warning'
              >
                <TbBan fontSize={16} />
              </span>
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('dashboard.achievements.protectedTooltip')}</AppTooltip.Content>
          </AppTooltip.Root>
        ) : isUnlockBlocked ? (
          <span
            aria-label={t('dashboard.achievements.sets.notOwned')}
            className='flex size-8 items-center justify-center text-muted'
          >
            <TbShoppingCartX fontSize={16} />
          </span>
        ) : (
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <Button
                isIconOnly
                aria-label={quickActionLabel}
                isPending={isPending}
                size='sm'
                variant={achievement.achieved ? 'danger-soft' : 'primary'}
                onPress={onQuickToggle}
              >
                {achievement.achieved ? <TbLock fontSize={15} /> : <TbLockOpen fontSize={15} />}
              </Button>
            </AppTooltip.Trigger>
            <AppTooltip.Content>{quickActionLabel}</AppTooltip.Content>
          </AppTooltip.Root>
        )}
      </div>
    </div>
  )
}
