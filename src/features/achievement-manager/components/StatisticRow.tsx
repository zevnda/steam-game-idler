import type { StatDto } from '../types'
import { useTranslation } from 'react-i18next'
import { TbBan, TbTrendingUp } from 'react-icons/tb'
import { cn, NumberField, Typography } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'

interface StatisticRowProps {
  stat: StatDto
  value: number
  isEdited: boolean
  onChange: (value: number) => void
}

// Card treatment mirrors AchievementRow.tsx, but slimmer: name (+ status chips) on the left, value
// on the right. Earlier versions also had a generic chart-icon tile on every row (identical on all
// of them, so it carried no information) and a "Flags: None"-style raw flags line under the name -
// internal jargon that was "None" for nearly every stat. The two flags that actually matter to a
// user are now plain-language chips instead: "Only increases" (incrementOnly) and, via the value
// pill on the right, protected. Keep StatisticsList.tsx's ROW_HEIGHT in sync with this row's height.
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
          'flex h-full items-center gap-3 rounded-xl border px-4',
          'duration-150 bg-surface hover:border-accent/50',
          isEdited ? 'border-accent/60' : 'border-border',
        )}
      >
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <Typography
            truncate
            className='min-w-0'
            title={stat.name}
            type='body-sm'
            weight='semibold'
          >
            {stat.name}
          </Typography>
          {isEdited && (
            <span className='shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent'>
              {t('dashboard.achievements.edited')}
            </span>
          )}
          {stat.incrementOnly && (
            <AppTooltip.Root>
              <AppTooltip.Trigger>
                <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-muted'>
                  <TbTrendingUp fontSize={11} />
                  {t('dashboard.achievements.incrementOnly')}
                </span>
              </AppTooltip.Trigger>
              <AppTooltip.Content>
                {t('dashboard.achievements.incrementOnlyTooltip')}
              </AppTooltip.Content>
            </AppTooltip.Root>
          )}
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
            aria-label={stat.name}
            className='w-36 shrink-0'
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
