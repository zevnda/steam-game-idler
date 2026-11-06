import { Trans, useTranslation } from 'react-i18next'
import { TbClock, TbDice5 } from 'react-icons/tb'
import { formatWait } from '../utils/orderTimeline'
import { cn, NumberField, Popover, Typography } from '@heroui/react'

// Preset waits offered in the popover, in minutes.
const PRESET_MINUTES = [5, 15, 30, 60, 120]

interface WaitChipProps {
  // `first` = the delay before the first unlock, where unset means "no wait" (order.rs's
  // `delay_before_first_unlock` defaults to 0). `next` = a per-achievement `delayNextUnlock`,
  // where unset means a random wait from the Unlock interval setting (manager.rs's
  // `random_delay_ms` fallback) - the two blanks mean different things, so they're labelled
  // differently rather than sharing one "empty" look.
  kind: 'first' | 'next'
  value: number | undefined
  // The Unlock interval setting (minutes), null until it loads - labels the random chip.
  interval: [number, number] | null
  // The achievement this wait comes before - only used by `next` for the popover heading.
  nextName?: string
  isDisabled?: boolean
  onChange: (value: number | undefined) => void
}

// Splits a fractional-minutes wait into the popover's hours + minutes fields. Minutes keep up to
// two decimals, so an imported 2.5-minute wait round-trips through the fields unchanged.
const splitWait = (value: number | undefined) => {
  if (value === undefined) return { hours: NaN, minutes: NaN }
  const hours = Math.floor(value / 60)
  return { hours, minutes: Math.round((value - hours * 60) * 100) / 100 }
}

// One wait on AchievementOrderList.tsx's timeline, drawn on the line between two steps. A set wait
// is a solid accent chip; an unset one is dashed and muted, so "random"/"no wait" never reads as a
// value someone typed. Pressing it opens a popover to pick a preset or type hours + minutes - the
// change applies immediately (same as the old inline NumberField), and only lands on disk with
// the overlay's Save, same as every other edit in this editor.
export const WaitChip = ({
  kind,
  value,
  interval,
  nextName,
  isDisabled,
  onChange,
}: WaitChipProps) => {
  const { t } = useTranslation()
  const isUnset = value === undefined
  const { hours, minutes } = splitWait(value)

  const label =
    kind === 'first'
      ? isUnset || value === 0
        ? t('dashboard.achievementUnlocker.order.wait.firstNone')
        : t('dashboard.achievementUnlocker.order.wait.firstSet', {
            duration: formatWait(t, value),
          })
      : isUnset
        ? interval
          ? t('dashboard.achievementUnlocker.order.wait.randomRange', {
              min: interval[0],
              max: interval[1],
            })
          : t('dashboard.achievementUnlocker.order.wait.random')
        : value === 0
          ? t('dashboard.achievementUnlocker.order.wait.none')
          : t('dashboard.achievementUnlocker.order.wait.set', { duration: formatWait(t, value) })

  // Empty fields mean "unset" (random / no wait), not 0 - but once either field has a number,
  // the other counts as 0 so typing just "45" into minutes is a 45-minute wait.
  const commit = (nextHours: number, nextMinutes: number) => {
    if (Number.isNaN(nextHours) && Number.isNaN(nextMinutes)) {
      onChange(undefined)
      return
    }
    const total =
      (Number.isNaN(nextHours) ? 0 : nextHours) * 60 + (Number.isNaN(nextMinutes) ? 0 : nextMinutes)
    onChange(Math.round(total * 100) / 100)
  }

  const presetClass = (isActive: boolean) =>
    cn(
      'h-7 flex-1 cursor-pointer whitespace-nowrap rounded-full px-2.5 text-xs duration-150',
      isActive ? 'bg-accent text-accent-foreground' : 'bg-default hover:bg-default-hover',
    )

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-disabled={isDisabled || undefined}
        className={cn(
          'inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-3 text-xs outline-none duration-150',
          'focus-visible:ring-2 focus-visible:ring-focus',
          isUnset || value === 0
            ? 'border border-dashed border-surface-tertiary text-muted hover:border-muted hover:text-foreground'
            : 'bg-accent/15 font-medium text-accent ring-1 ring-accent/30 hover:bg-accent/20',
          isDisabled ? 'pointer-events-none opacity-50' : 'cursor-pointer',
        )}
      >
        {isUnset && kind === 'next' ? (
          <TbDice5 className='shrink-0' fontSize={13} />
        ) : (
          <TbClock className='shrink-0' fontSize={13} />
        )}
        <span className='truncate'>{label}</span>
      </Popover.Trigger>

      {/* The chips sit centered in the timeline (AchievementOrderList.tsx), so this opens centered
          below the chip. `w-max` sizes it to its widest row, keeping the presets on one line. */}
      <Popover.Content offset={8} placement='bottom'>
        <Popover.Dialog className='flex w-max max-w-[90vw] flex-col gap-3 p-3'>
          <Typography type='body-xs' weight='semibold'>
            {kind === 'first' ? (
              t('dashboard.achievementUnlocker.order.wait.firstHeading')
            ) : (
              <Trans
                components={{ name: <span className='text-accent' /> }}
                i18nKey='dashboard.achievementUnlocker.order.wait.heading'
                values={{ name: nextName }}
              />
            )}
          </Typography>

          {/* `flex-1` chips stretch to the popover's width (set by the wider custom row below), so
              the presets share it evenly instead of leaving a ragged gap at the end. */}
          <div className='flex gap-1.5'>
            <button
              className={presetClass(isUnset)}
              type='button'
              onClick={() => onChange(undefined)}
            >
              {kind === 'first'
                ? t('dashboard.achievementUnlocker.order.wait.none')
                : t('dashboard.achievementUnlocker.order.wait.randomPreset')}
            </button>
            {PRESET_MINUTES.map(preset => (
              <button
                key={preset}
                className={presetClass(value === preset)}
                type='button'
                onClick={() => onChange(preset)}
              >
                {formatWait(t, preset)}
              </button>
            ))}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Typography color='muted' type='body-xs'>
              {t('dashboard.achievementUnlocker.order.wait.custom')}
            </Typography>
            <NumberField
              aria-label={t('dashboard.achievementUnlocker.order.wait.hours')}
              className='w-32'
              formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
              minValue={0}
              value={hours}
              onChange={next => commit(next, minutes)}
            >
              <NumberField.Group className='bg-field hover:bg-field-hover text-foreground'>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
            <Typography color='muted' type='body-xs'>
              {t('dashboard.achievementUnlocker.order.wait.hoursUnit')}
            </Typography>
            <NumberField
              aria-label={t('common.minutes')}
              // Wider than hours - minutes takes decimals (0.5 = 30s, up to e.g. 59.99), and the
              // input only gets what's left between the two fixed-width stepper buttons.
              className='w-34'
              formatOptions={{ maximumFractionDigits: 2, useGrouping: false }}
              minValue={0}
              value={minutes}
              onChange={next => commit(hours, next)}
            >
              <NumberField.Group className='bg-field hover:bg-field-hover text-foreground'>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
            <Typography color='muted' type='body-xs'>
              {t('dashboard.achievementUnlocker.order.wait.minutesUnit')}
            </Typography>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  )
}
