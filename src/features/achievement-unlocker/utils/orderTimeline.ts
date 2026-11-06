import type { TFunction } from 'i18next'
import type { OrderableAchievement } from '../hooks/useAchievementOrder'

// Waits are stored as fractional minutes (order.rs's `delay_next_unlock`/`delay_before_first_unlock`
// are `f64` minutes, and useAchievementOrder.ts's importTimings rounds to 0.1 min), so a wait can
// carry seconds. Shown as the two largest units (days + hours down to minutes + seconds) - a longer
// wait drops its smaller units, which only affects the label, never the stored value.
export const formatWait = (t: TFunction, minutes: number) => {
  const totalSeconds = Math.max(0, Math.round(minutes * 60))
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (d > 0) {
    return h > 0
      ? t('dashboard.achievementUnlocker.order.duration.daysHours', { d, h })
      : t('dashboard.achievementUnlocker.order.duration.days', { d })
  }
  if (h > 0) {
    return m > 0
      ? t('dashboard.achievementUnlocker.order.duration.hoursMinutes', { h, m })
      : t('dashboard.achievementUnlocker.order.duration.hours', { h })
  }
  if (m > 0) {
    return s > 0
      ? t('dashboard.achievementUnlocker.order.duration.minutesSeconds', { m, s })
      : t('dashboard.achievementUnlocker.order.duration.minutes', { m })
  }
  return t('dashboard.achievementUnlocker.order.duration.seconds', { s })
}

// One included achievement's place in the run: its 1-based step number, and the earliest/latest
// time (minutes after the game starts) it can unlock. The two only differ once a random wait is
// involved.
export interface TimelineStep {
  step: number
  earliest: number
  latest: number
}

export interface OrderTimeline {
  steps: Map<string, TimelineStep>
  // Included achievement id -> the name of the next included achievement, for every included
  // achievement that has one - only these have a wait that actually runs. Mirrors
  // achievement_unlocker::manager's scan: skipped achievements are filtered out *before* delays
  // are applied, so a skipped achievement's own `delayNextUnlock` never runs, and the last
  // included one's has nothing to wait for.
  nextNameById: Map<string, string>
  includedCount: number
  earliestFinish: number
  latestFinish: number
}

// Projects the saved order the same way the unlocker will run it: `delayBeforeFirstUnlock`
// (none = 0), then each included achievement's `delayNextUnlock` before the next included one,
// falling back to a random wait within `interval` (the Unlock interval setting, minutes) when
// unset. `interval` is null until the settings load - random waits then count as 0 so the
// numbering still renders, and callers hide the estimate.
export const buildOrderTimeline = (
  achievements: OrderableAchievement[],
  delayBeforeFirstUnlock: number | '',
  interval: [number, number] | null,
) => {
  const included = achievements.filter(achievement => !achievement.skip)
  const steps = new Map<string, TimelineStep>()
  const nextNameById = new Map<string, string>()
  const firstWait = typeof delayBeforeFirstUnlock === 'number' ? delayBeforeFirstUnlock : 0
  let earliest = firstWait
  let latest = firstWait

  included.forEach((achievement, index) => {
    if (index > 0) {
      const previous = included[index - 1]
      nextNameById.set(previous.id, achievement.name)
      const wait = previous.delayNextUnlock
      earliest += wait ?? interval?.[0] ?? 0
      latest += wait ?? interval?.[1] ?? 0
    }
    steps.set(achievement.id, { step: index + 1, earliest, latest })
  })

  return {
    steps,
    nextNameById,
    includedCount: included.length,
    earliestFinish: earliest,
    latestFinish: latest,
  }
}

// "1h 20m" for an exact time, "40m – 2h 20m" for a range, "Right away" for no time at all.
export const formatTimeRange = (t: TFunction, earliest: number, latest: number) =>
  Math.round(latest * 60) === 0
    ? t('dashboard.achievementUnlocker.order.rightAway')
    : Math.round(earliest * 60) === Math.round(latest * 60)
      ? formatWait(t, earliest)
      : t('dashboard.achievementUnlocker.order.timeRange', {
          from: formatWait(t, earliest),
          to: formatWait(t, latest),
        })
