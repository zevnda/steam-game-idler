import type { AchievementDto } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbCheck, TbLock, TbLockOpen } from 'react-icons/tb'
import {
  getAchievementRarityTier,
  RARITY_TIER_CLASSES,
  RARITY_TIER_LABEL_KEYS,
} from '../utils/achievementRarity'
import { Button, Checkbox, cn, Typography } from '@heroui/react'
import Image from 'next/image'
import { AppTooltip } from '@/shared/components/AppTooltip'

interface AchievementRowProps {
  achievement: AchievementDto
  appId: number
  isPending: boolean
  isSelected: boolean
  onSelectChange: (checked: boolean) => void
  onToggle: () => void
}

// Steam only ever gives achievement icons as a bare filename (see
// libs/SteamUtility/Core/SchemaParsing/SchemaWalker.cs's `icon`/`icon_gray` fields) - this base URL
// is the same CDN path `main` already used to resolve one into a real image.
const ICON_BASE_URL = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'

// Grid layout (checkbox | icon | name+description | action) mirrors main's AchievementsList.tsx
// row shape, rather than the earlier flat-list treatment - restyled into a card per row (see the
// wrapping div below) since a dense flat list with a plain border-b read as flat/boring for a
// gamer-facing tool. Keep AchievementsTab.tsx's column-header row's grid template in sync with
// this one, and AchievementsList.tsx's ROW_HEIGHT in sync with this row's actual rendered height.
const ROW_GRID = 'grid-cols-[28px_52px_1fr_auto]'

export const AchievementRow = ({
  achievement,
  appId,
  isPending,
  isSelected,
  onSelectChange,
  onToggle,
}: AchievementRowProps) => {
  const { t } = useTranslation()
  const icon = achievement.achieved ? achievement.iconNormal : achievement.iconLocked
  const rarityTier =
    achievement.percent !== undefined ? getAchievementRarityTier(achievement.percent) : null

  return (
    <div className='h-full pb-2'>
      {/* Row-to-row gap comes from AchievementsList.tsx's `Row` wrapper (`pt-2`), not padding
          here - don't reintroduce padding on this outer div, it'd double up with that and shrink
          the card below its intended height.
          A previous version dimmed achieved/protected rows via a whole-row `opacity-40` - against
          the overlay's hero background art (see AchievementManagerOverlay.tsx), that made the
          faded-out text nearly unreadable since the image showed straight through it. De-emphasis
          for those rows now comes only from a solid (not translucent) but slightly quieter card
          background plus the softer icon ring/badge below - text itself always stays fully opaque. */}
      <div
        className={cn(
          'grid h-full items-center gap-3 rounded-xl border px-3',
          'duration-150 bg-surface hover:border-accent/50',
          ROW_GRID,
          achievement.achieved ? 'border-border/60' : 'border-border',
        )}
      >
        <Checkbox
          aria-label={
            achievement.achieved
              ? `Stage "${achievement.name}" to be locked`
              : `Stage "${achievement.name}" to be unlocked`
          }
          isDisabled={achievement.protectedAchievement}
          isSelected={isSelected}
          onChange={onSelectChange}
        >
          <Checkbox.Content>
            <Checkbox.Control className='bg-surface-tertiary hover:bg-surface-hover text-foreground'>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>

        <div className='relative shrink-0'>
          <Image
            alt=''
            className={cn(
              'rounded-lg ring-2',
              achievement.achieved
                ? 'ring-border/50'
                : 'shadow-[0_0_10px_-1px] shadow-accent/40 ring-accent/50',
            )}
            height={44}
            src={`${ICON_BASE_URL}${appId}/${icon}`}
            width={44}
          />
          {/* Small corner badge echoing the row's state (done vs. lockable) at a glance, on top of
              the icon itself - a common "trophy card" affordance in game UIs, cheap to render since
              react-window only ever mounts the handful of rows actually in the viewport. */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-2 ring-surface',
              achievement.achieved ? 'bg-success text-white' : 'bg-surface-tertiary text-muted',
            )}
          >
            {achievement.achieved ? <TbCheck fontSize={11} /> : <TbLock fontSize={10} />}
          </div>
        </div>

        <div className='flex min-w-0 flex-col'>
          <div className='flex items-baseline gap-2'>
            <AppTooltip.Root>
              <AppTooltip.Trigger>
                <Typography truncate className='min-w-0' type='body-sm' weight='semibold'>
                  {achievement.name}
                </Typography>
              </AppTooltip.Trigger>
              <AppTooltip.Content>{achievement.id}</AppTooltip.Content>
            </AppTooltip.Root>
            {rarityTier && (
              <span
                className={cn(
                  'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
                  RARITY_TIER_CLASSES[rarityTier],
                )}
              >
                {achievement.percent!.toFixed(1)}% • {t(RARITY_TIER_LABEL_KEYS[rarityTier])}
              </span>
            )}
          </div>
          <Typography
            className={cn(
              'truncate',
              achievement.hidden && !achievement.achieved && 'blur-xs hover:blur-none',
            )}
            color='muted'
            type='body-xs'
          >
            {achievement.description || t('dashboard.achievements.noDescription')}
          </Typography>
        </div>

        {achievement.protectedAchievement ? (
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <span className='inline-flex'>
                <Button
                  isDisabled
                  isIconOnly
                  aria-label={t('dashboard.achievements.protectedTooltip')}
                  size='sm'
                  variant='ghost'
                >
                  <TbBan fontSize={16} />
                </Button>
              </span>
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('dashboard.achievements.protectedTooltip')}</AppTooltip.Content>
          </AppTooltip.Root>
        ) : (
          <Button
            isPending={isPending}
            size='sm'
            variant={achievement.achieved ? 'danger' : 'primary'}
            onPress={onToggle}
          >
            {achievement.achieved ? (
              <>
                <TbLock fontSize={16} />
                {t('dashboard.achievements.actions.lock')}
              </>
            ) : (
              <>
                <TbLockOpen fontSize={16} />
                {t('dashboard.achievements.actions.unlock')}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
