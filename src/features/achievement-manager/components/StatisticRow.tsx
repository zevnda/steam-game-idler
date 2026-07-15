import type { StatDto } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbChartBar, TbTrendingUp } from 'react-icons/tb'
import { cn, NumberField, Typography } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'

interface StatisticRowProps {
  stat: StatDto
  value: number
  isEdited: boolean
  onChange: (value: number) => void
}

// Grid layout (icon | name+flags | value) and card treatment mirror AchievementRow.tsx's row
// shape, restyled the same way for the same reason - a flat bordered list read as flat/boring next
// to it once that one got the card treatment. Keep StatisticsList.tsx's ROW_HEIGHT in sync with
// this row's actual rendered height, and StatisticsTab.tsx's column-header grid template in sync
// with this grid.
const ROW_GRID = 'grid-cols-[44px_1fr_auto]'

export const StatisticRow = ({ stat, value, isEdited, onChange }: StatisticRowProps) => {
  const { t } = useTranslation()

  return (
    // `pb-2` here + StatisticsList.tsx's `Row` wrapper `mt-2` together produce the actual
    // row-to-row gap - matches AchievementRow.tsx's identical pairing (see that file's doc
    // comment): `mt-2` alone just shifts every row uniformly (react-window gives each row slot an
    // explicit `height`, so margin doesn't shrink it), it's this trailing padding that actually
    // carves out empty space at the bottom of each row's slot.
    <div className='h-full pb-2'>
      <div
        className={cn(
          'grid h-full items-center gap-3 rounded-xl border px-3',
          'duration-150 bg-surface hover:border-accent/50',
          ROW_GRID,
          isEdited ? 'border-accent/60' : 'border-border',
        )}
      >
        <div className='relative shrink-0'>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg',
              isEdited ? 'bg-accent/15 text-accent' : 'bg-surface-tertiary text-muted',
            )}
          >
            <TbChartBar fontSize={20} />
          </div>
          {/* Surfaces `incrementOnly` - previously not shown anywhere in the UI at all, despite
              being genuinely useful context (a counter-style stat that can only go up, e.g. total
              kills) - same corner-badge treatment as AchievementRow.tsx's done/lockable indicator.
              Position/size classes go on `AppTooltip.Trigger` itself, not a `div` nested inside it
              - HeroUI's tooltip trigger renders `display: inline-block` with no intrinsic size, so
              a single `position: absolute` child (which contributes no size to a normal-flow
              parent) collapses that wrapper to 0x0 and the badge renders in the wrong place
              entirely (confirmed live: it landed bottom-left of the whole card, not the icon). */}
          {stat.incrementOnly && (
            <AppTooltip.Root>
              <AppTooltip.Trigger className='absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-surface-tertiary text-muted ring-2 ring-surface'>
                <TbTrendingUp fontSize={10} />
              </AppTooltip.Trigger>
              <AppTooltip.Content>
                {t('dashboard.achievements.incrementOnlyTooltip')}
              </AppTooltip.Content>
            </AppTooltip.Root>
          )}
        </div>

        <div className='flex min-w-0 flex-col'>
          <div className='flex items-baseline gap-2'>
            <Typography truncate className='min-w-0' type='body-sm' weight='semibold'>
              {stat.name}
            </Typography>
            {isEdited && (
              <span className='shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent'>
                {t('dashboard.achievements.edited')}
              </span>
            )}
          </div>
          <Typography
            className={cn('truncate', stat.protectedStat ? 'text-warning' : undefined)}
            color={stat.protectedStat ? undefined : 'muted'}
            type='body-xs'
          >
            {t('dashboard.achievements.statFlags', { flags: stat.flags })}
          </Typography>
        </div>

        {stat.protectedStat ? (
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <span className='text-warning inline-flex shrink-0 items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1.5'>
                <TbBan fontSize={14} />
                <Typography type='body-xs' weight='semibold'>
                  {value}
                </Typography>
              </span>
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('dashboard.achievements.protectedTooltip')}</AppTooltip.Content>
          </AppTooltip.Root>
        ) : (
          <NumberField
            aria-label={`${stat.name} value`}
            className='w-32 shrink-0'
            formatOptions={{ useGrouping: false }}
            value={value}
            onChange={onChange}
          >
            <NumberField.Group className='bg-surface-secondary hover:bg-surface-hover text-foreground'>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
        )}
      </div>
    </div>
  )
}
