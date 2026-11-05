import type {
  AchievementUnlockerState,
  ActiveGameProgress,
  RecentUnlock,
  UpcomingAchievement,
} from '../types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbClockHour4 } from 'react-icons/tb'
import { AchievementUnlockerCompletedRow } from './AchievementUnlockerCompletedRow'
import { cn, ProgressBar } from '@heroui/react'
import Image from 'next/image'
import { GamePosterCard } from '@/shared/components/GamePosterCard'
import { RunHero, RunHeroCard } from '@/shared/components/running/RunHero'
import {
  ProgressRing,
  RunSection,
  RunSummary,
  StatTile,
  StatTiles,
} from '@/shared/components/running/RunPanels'
import { useNow } from '@/shared/hooks/useNow'
import { usePlayingSessionStore } from '@/shared/stores/playingSessionStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { formatDuration } from '@/shared/utils/formatDuration'

// The Achievement Unlocker's running screen content - the Overview and Details tabs RunScreen
// hosts (see AchievementUnlockerPage). Display only: unlocking runs in the backend
// (`achievement_unlocker::manager`), and this reads the state it publishes.
//
// One game at a time gets a single banner; several at once (Casual/Gamer tier's concurrent mode) get
// a card each, and their upcoming unlocks merge into one time-ordered list tagged with each game's
// colour.

const ACHIEVEMENT_ICON_BASE_URL =
  'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'

// Mirrors src-tauri/src/achievement_unlocker/manager.rs::INITIAL_DELAY (a fixed 10s) - not sent
// over the wire since it never changes. Only a fallback: the backend sends the delay's end time.
const INITIAL_DELAY_MS = 10_000

// How many upcoming unlocks the merged lists and the timeline show
const PLAN_LIMIT = 6
const TIMELINE_LIMIT = 5
// The closest two timeline markers may sit, in % of the track (wide enough that their 96px labels
// never touch at the smallest window), and the shortest time span the track shows, so a single
// imminent unlock doesn't sit at the far end.
const TIMELINE_MIN_GAP = 17
const TIMELINE_MIN_WINDOW_MS = 10 * 60_000
const RECENT_SHOWN = 3

// A colour per running game, so its unlocks can be told apart in the merged lists. The first is the
// accent, as in single-game mode; the rest are spread around the hue wheel.
const gameColor = (index: number) =>
  index === 0 ? 'var(--accent)' : `oklch(0.74 0.14 ${(254 + index * 97) % 360})`

const AchievementIcon = ({ appId, icon, size }: { appId: number; icon: string; size: number }) => (
  <Image
    alt=''
    className='shrink-0 rounded-lg'
    height={size}
    src={`${ACHIEVEMENT_ICON_BASE_URL}${appId}/${icon}`}
    width={size}
  />
)

const useIsPaused = () => {
  const activeKey = useSessionStore(state => state.activeAccountKey)
  return usePlayingSessionStore(state => Boolean(activeKey && state.entries[activeKey]))
}

const useClockTime = () => {
  const { i18n } = useTranslation()
  return (ms: number) =>
    new Date(ms).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
}

interface PlannedUnlock extends UpcomingAchievement {
  game: ActiveGameProgress
  color: string
}

// Every running game's upcoming unlocks, soonest first
const mergedPlan = (active: ActiveGameProgress[]) =>
  active
    .flatMap((game, index) =>
      game.upcoming.map(achievement => ({ ...achievement, game, color: gameColor(index) })),
    )
    .sort((a, b) => a.unlockAtMs - b.unlockAtMs)

// While the queue is first being checked nothing is running yet, so every figure would read zero -
// the scan card (RunScreen's banner) stands alone until a game starts.
const isOnlyScanning = (state: AchievementUnlockerState) =>
  state.scanProgress !== null && state.scanProgress !== undefined && state.active.length === 0

const stillToUnlock = (state: AchievementUnlockerState) =>
  state.active.reduce((sum, game) => sum + game.achievementCount, 0) +
  state.queued.reduce((sum, game) => sum + game.achievementCount, 0)

// A game's progress line: "31/42 unlocked", "11 achievements remaining" and a bar
const GameProgress = ({ game, size }: { game: ActiveGameProgress; size: 'lg' | 'sm' }) => {
  const { t } = useTranslation()
  if (game.total === 0) return null
  const unlockedText = t('dashboard.achievementUnlocker.progress.completedCount', {
    unlocked: game.unlocked,
    total: game.total,
  })
  return (
    <div className={cn('flex flex-col gap-2', size === 'lg' && 'max-w-110')}>
      <div className='flex items-baseline justify-between gap-3'>
        <span className={cn('font-bold tabular-nums', size === 'lg' ? 'text-base' : 'text-xs')}>
          {unlockedText}
        </span>
        <span className='text-xs tabular-nums text-white/70'>
          {t('dashboard.achievementUnlocker.progress.remaining', { count: game.achievementCount })}
        </span>
      </div>
      <ProgressBar
        aria-label={unlockedText}
        maxValue={game.total}
        minValue={0}
        value={game.unlocked}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  )
}

// What a running game is doing next: waiting for the schedule window, its short starting delay, or
// its next achievement with a countdown (paused while another session on the account is playing).
const NextUnlock = ({ game, size }: { game: ActiveGameProgress; size: 'lg' | 'sm' }) => {
  const { t } = useTranslation()
  const now = useNow()
  const isPaused = useIsPaused()
  const clockTime = useClockTime()

  if (game.isWaitingForSchedule) {
    return (
      <div className='flex items-center gap-3 text-warning'>
        <TbClockHour4 className='shrink-0' fontSize={size === 'lg' ? 28 : 20} />
        <span className='text-sm font-semibold'>
          {t('dashboard.achievementUnlocker.progress.waitingForSchedule')}
        </span>
      </div>
    )
  }
  if (game.isInitialDelay) {
    const remaining = game.initialDelayEndsAtMs ? game.initialDelayEndsAtMs - now : INITIAL_DELAY_MS
    return (
      <div className='flex items-center justify-between gap-3'>
        <span className='font-semibold'>
          {t('dashboard.achievementUnlocker.progress.starting')}
        </span>
        <span className={cn('font-mono font-bold', size === 'lg' ? 'text-3xl' : 'text-sm')}>
          {formatDuration(remaining / 1000)}
        </span>
      </div>
    )
  }
  const next = game.upcoming[0]
  if (!next) return null
  return (
    <div className={cn('flex flex-col', size === 'lg' ? 'gap-4' : 'gap-0')}>
      <div className='flex items-center gap-3'>
        <AchievementIcon appId={game.appId} icon={next.icon} size={size === 'lg' ? 48 : 36} />
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span
            className={cn('truncate font-semibold', size === 'sm' && 'text-sm')}
            title={next.name}
          >
            {next.name}
          </span>
          {next.percent !== undefined && (
            <span className='text-xs tabular-nums text-muted'>{next.percent.toFixed(1)}%</span>
          )}
        </div>
        {size === 'sm' && (
          <span className='shrink-0 font-mono text-sm font-bold'>
            {isPaused ? t('common.status.paused') : formatDuration((next.unlockAtMs - now) / 1000)}
          </span>
        )}
      </div>
      {size === 'lg' && (
        <div className='flex items-end justify-between gap-3'>
          <span className='font-mono text-3xl font-bold'>
            {isPaused ? t('common.status.paused') : formatDuration((next.unlockAtMs - now) / 1000)}
          </span>
          <span className='text-sm tabular-nums text-muted'>{clockTime(next.unlockAtMs)}</span>
        </div>
      )}
    </div>
  )
}

// One row of an upcoming-unlocks list
const PlanRow = ({ item, showGame }: { item: PlannedUnlock; showGame: boolean }) => {
  const { t } = useTranslation()
  const now = useNow()
  const isPaused = useIsPaused()
  const clockTime = useClockTime()
  return (
    <div className='flex items-center gap-3 py-2.5 first:pt-0 last:pb-0'>
      <AchievementIcon appId={item.game.appId} icon={item.icon} size={34} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-sm font-semibold' title={item.name}>
          {item.name}
        </span>
        <span className='flex min-w-0 items-center gap-1.5 text-xs text-muted'>
          {showGame && (
            <>
              <span className='size-2 shrink-0 rounded-full' style={{ background: item.color }} />
              <span className='truncate'>{item.game.name}</span>
            </>
          )}
          {item.percent !== undefined && (
            <span className='shrink-0 tabular-nums'>
              {showGame && '· '}
              {item.percent.toFixed(1)}%
            </span>
          )}
        </span>
      </div>
      <span className='min-w-14 shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-muted @max-3xl:hidden'>
        {clockTime(item.unlockAtMs)}
      </span>
      <span className='min-w-16 shrink-0 whitespace-nowrap text-right font-mono text-sm'>
        {isPaused ? t('common.status.paused') : formatDuration((item.unlockAtMs - now) / 1000)}
      </span>
    </div>
  )
}

const QueuedGames = ({ state }: { state: AchievementUnlockerState }) => {
  const { t } = useTranslation()
  if (state.queued.length === 0) return null
  return (
    <RunSection title={t('common.tabs.queue')}>
      <div className='game-grid'>
        {state.queued.map(game => (
          <GamePosterCard
            key={game.appId}
            appId={game.appId}
            isAlwaysRevealed
            meta={t('dashboard.achievementUnlocker.progress.remaining', {
              count: game.achievementCount,
            })}
            name={game.name}
          />
        ))}
      </div>
    </RunSection>
  )
}

const CompletedGames = ({ state }: { state: AchievementUnlockerState }) => {
  const { t } = useTranslation()
  if (state.completed.length === 0) return null
  return (
    <RunSection title={t('common.completedThisSessionCount', { count: state.completed.length })}>
      <div className='flex flex-col gap-2'>
        {state.completed.map(game => (
          <AchievementUnlockerCompletedRow
            key={game.appId}
            name={game.name}
            reason={game.reason}
            total={game.total}
            unlocked={game.unlocked}
          />
        ))}
      </div>
    </RunSection>
  )
}

interface AchievementUnlockerRunViewProps {
  state: AchievementUnlockerState
}

// ---------- Overview ----------

export const AchievementUnlockerOverview = ({ state }: AchievementUnlockerRunViewProps) => {
  const { t } = useTranslation()
  if (isOnlyScanning(state)) return null
  const isMulti = state.active.length > 1
  const plan = mergedPlan(state.active)
  const left = stillToUnlock(state)
  // One game: its first upcoming unlock is already on the banner, so the list starts after it
  const upNext = isMulti ? plan.slice(0, PLAN_LIMIT) : plan.slice(1, PLAN_LIMIT)

  return (
    <>
      {state.active.length === 1 && (
        <RunHero
          appId={state.active[0].appId}
          heading={t('dashboard.achievementUnlocker.progress.currentGame')}
          name={state.active[0].name}
          side={
            <div className='flex w-82 shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md @max-3xl:w-64'>
              <span className='text-xs font-semibold text-muted'>
                {t('dashboard.achievementUnlocker.progress.nextAchievement')}
              </span>
              <NextUnlock game={state.active[0]} size='lg' />
            </div>
          }
        >
          <GameProgress game={state.active[0]} size='lg' />
        </RunHero>
      )}
      {isMulti && (
        <div className='grid grid-cols-3 gap-4 @max-4xl:grid-cols-2'>
          {state.active.map((game, index) => (
            <div
              key={game.appId}
              className='flex flex-col overflow-hidden rounded-2xl border border-border bg-surface'
            >
              <RunHeroCard
                appId={game.appId}
                className='rounded-none'
                marker={
                  <span
                    className='block size-2.5 rounded-full ring-3 ring-black/50'
                    style={{ background: gameColor(index) }}
                  />
                }
                name={game.name}
              >
                <GameProgress game={game} size='sm' />
              </RunHeroCard>
              <div className='p-3'>
                <NextUnlock game={game} size='sm' />
              </div>
            </div>
          ))}
        </div>
      )}

      <RunSummary
        done={state.unlockedThisSession}
        doneLabel={t('dashboard.achievementUnlocker.progress.unlockedThisSession')}
        left={left}
        leftLabel={t('dashboard.achievementUnlocker.progress.stillToUnlock')}
        progressText={t('dashboard.achievementUnlocker.progress.achievementsProgress', {
          done: state.unlockedThisSession.toLocaleString(),
          total: (state.unlockedThisSession + left).toLocaleString(),
        })}
      />

      {upNext.length > 0 && (
        <RunSection title={t('dashboard.achievementUnlocker.progress.upNext')}>
          <div className='flex flex-col divide-y divide-border'>
            {upNext.map(item => (
              <PlanRow key={`${item.game.appId}-${item.id}`} item={item} showGame={isMulti} />
            ))}
          </div>
        </RunSection>
      )}
      <QueuedGames state={state} />
      <CompletedGames state={state} />
    </>
  )
}

// ---------- Details ----------

// The soonest unlock across every running game, as a countdown
const SoonestUnlockValue = ({ state }: { state: AchievementUnlockerState }) => {
  const { t } = useTranslation()
  const now = useNow()
  const isPaused = useIsPaused()
  const soonest = mergedPlan(state.active)[0]
  if (soonest && isPaused) return <>{t('common.status.paused')}</>
  if (!soonest) {
    const starting = state.active.find(game => game.isInitialDelay)
    if (starting?.initialDelayEndsAtMs) {
      return (
        <span className='font-mono'>
          {formatDuration((starting.initialDelayEndsAtMs - now) / 1000)}
        </span>
      )
    }
    return <>—</>
  }
  return <span className='font-mono'>{formatDuration((soonest.unlockAtMs - now) / 1000)}</span>
}

// The next few unlocks on a time track. The dot at the left is where an unlock happens: each
// achievement sits at its time to go on the scale and creeps left toward the dot, reaching it as it
// unlocks, then drops off the track as the next set arrives. The scale is fixed for each set of
// upcoming unlocks (from now to just past the last one) rather than re-fitted every second, which is
// what makes the creep visible; it re-fits whenever the set changes. A marker that would land on top
// of the one before it is nudged right just enough to keep their labels apart. The first shows its
// countdown, the rest their clock time.
const Timeline = ({ plan, showGame }: { plan: PlannedUnlock[]; showGame: boolean }) => {
  const { t } = useTranslation()
  const now = useNow()
  const clockTime = useClockTime()
  const items = plan.slice(0, TIMELINE_LIMIT)
  const lastUnlockAtMs = items.length > 0 ? items[items.length - 1].unlockAtMs : 0
  const planKey = items.map(item => `${item.game.appId}:${item.id}:${item.unlockAtMs}`).join('|')
  // Recomputed only when the set of unlocks changes - see the comment above
  const [scale, setScale] = useState({ planKey: '', windowMs: 1 })
  if (scale.planKey !== planKey) {
    setScale({ planKey, windowMs: Math.max(TIMELINE_MIN_WINDOW_MS, (lastUnlockAtMs - now) * 1.1) })
  }
  if (items.length === 0) return null

  // In % of the track: 0 is the unlock dot. Markers nudged past the end are left off; the plan
  // table below still lists them.
  let previous = -Infinity
  const positions = items.map(item => {
    const raw = (Math.max(0, item.unlockAtMs - now) / scale.windowMs) * 100
    const x = Math.max(raw, previous + TIMELINE_MIN_GAP)
    previous = x
    return x
  })

  return (
    <RunSection title={t('dashboard.achievementUnlocker.progress.upNext')}>
      {/* The track is inset from both edges so a marker's label still fits at either end. Fixed
          vertical positions, so every dot sits exactly on the line whatever its icon's size: icons
          end at 46px, the line is 56-60px, dots are centred on it, labels start at 70px. */}
      <div className='relative mx-12 h-30'>
        <div className='absolute -inset-x-12 top-14 h-1 rounded-full bg-default' />
        <span className='absolute left-0 top-[51px] size-3.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_6px_color-mix(in_oklab,var(--accent)_25%,transparent)]' />
        {items.map((item, index) =>
          positions[index] > 100 ? null : (
            <div
              key={`${item.game.appId}-${item.id}`}
              className='absolute inset-y-0 w-24 -translate-x-1/2 transition-[left] duration-1000 ease-linear'
              style={{ left: `${positions[index]}%` }}
            >
              <div className='flex h-11.5 items-end justify-center'>
                <AchievementIcon
                  appId={item.game.appId}
                  icon={item.icon}
                  size={index === 0 ? 42 : 34}
                />
              </div>
              <span
                className='absolute left-1/2 top-[53px] size-2.5 -translate-x-1/2 rounded-full border-2 border-surface'
                style={{
                  background: showGame
                    ? item.color
                    : index === 0
                      ? 'var(--accent)'
                      : 'var(--surface-tertiary)',
                }}
              />
              <div className='absolute inset-x-0 top-[70px] flex flex-col items-center gap-1 text-center'>
                <span className={cn('font-mono text-xs font-bold', index === 0 && 'text-accent')}>
                  {index === 0
                    ? formatDuration((item.unlockAtMs - now) / 1000)
                    : clockTime(item.unlockAtMs)}
                </span>
                <span className='line-clamp-2 px-1 text-[11px] leading-tight text-muted @max-3xl:hidden'>
                  {item.name}
                </span>
              </div>
            </div>
          ),
        )}
      </div>
    </RunSection>
  )
}

const RecentRow = ({ item, gameName }: { item: RecentUnlock; gameName?: string }) => {
  const clockTime = useClockTime()
  return (
    <div className='flex items-center gap-3 py-2.5 opacity-55 first:pt-0 last:pb-0'>
      <AchievementIcon appId={item.appId} icon={item.icon} size={34} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-sm font-semibold' title={item.name}>
          {item.name}
        </span>
        <span className='truncate text-xs text-muted'>
          {gameName && `${gameName} · `}
          {item.percent !== undefined && `${item.percent.toFixed(1)}%`}
        </span>
      </div>
      <span className='min-w-14 shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-muted @max-3xl:hidden'>
        {clockTime(item.unlockedAtMs)}
      </span>
      <span className='flex w-16 shrink-0 justify-end text-success'>
        <TbCheck fontSize={16} />
      </span>
    </div>
  )
}

export const AchievementUnlockerDetails = ({ state }: AchievementUnlockerRunViewProps) => {
  const { t } = useTranslation()
  if (isOnlyScanning(state)) return null
  const isMulti = state.active.length > 1
  const plan = mergedPlan(state.active)
  const left = stillToUnlock(state)
  const nameByAppId = new Map(
    [...state.active, ...state.completed, ...state.queued].map(game => [game.appId, game.name]),
  )

  return (
    <>
      <StatTiles>
        <StatTile
          label={t('dashboard.achievementUnlocker.progress.upNext')}
          value={<SoonestUnlockValue state={state} />}
          valueClassName='text-accent'
        />
        <StatTile
          label={t('dashboard.achievementUnlocker.progress.unlockedThisSession')}
          value={state.unlockedThisSession.toLocaleString()}
          valueClassName='text-success'
        />
        <StatTile
          label={t('dashboard.achievementUnlocker.progress.stillToUnlock')}
          value={left.toLocaleString()}
        />
      </StatTiles>

      <Timeline plan={plan} showGame={isMulti} />

      <div className='grid grid-cols-[minmax(0,17rem)_minmax(0,1fr)] gap-4 @max-4xl:grid-cols-1'>
        {state.active.length > 0 && (
          <RunSection className='self-start'>
            <div className={cn('flex flex-col gap-4', !isMulti && 'items-center text-center')}>
              {state.active.map((game, index) => {
                const percent = game.total > 0 ? Math.round((game.unlocked / game.total) * 100) : 0
                const unlockedText = t('dashboard.achievementUnlocker.progress.completedCount', {
                  unlocked: game.unlocked,
                  total: game.total,
                })
                return isMulti ? (
                  <div key={game.appId} className='flex items-center gap-3'>
                    <ProgressRing
                      color={gameColor(index)}
                      label={unlockedText}
                      max={game.total}
                      size={56}
                      stroke={6}
                      value={game.unlocked}
                    >
                      <span className='text-xs font-extrabold tabular-nums'>{percent}%</span>
                    </ProgressRing>
                    <div className='flex min-w-0 flex-col gap-0.5'>
                      <span className='truncate text-sm font-bold' title={game.name}>
                        {game.name}
                      </span>
                      <span className='text-xs tabular-nums text-muted'>{unlockedText}</span>
                    </div>
                  </div>
                ) : (
                  <div key={game.appId} className='flex flex-col items-center gap-3'>
                    <span className='font-bold'>{game.name}</span>
                    <ProgressRing
                      label={unlockedText}
                      max={game.total}
                      size={112}
                      stroke={9}
                      value={game.unlocked}
                    >
                      <span className='text-2xl font-extrabold tabular-nums'>{percent}%</span>
                    </ProgressRing>
                    <span className='text-xs tabular-nums text-muted'>{unlockedText}</span>
                  </div>
                )
              })}
            </div>
          </RunSection>
        )}

        {(plan.length > 0 || state.recent.length > 0) && (
          <RunSection className={cn(state.active.length === 0 && 'col-span-full')}>
            <div className='flex flex-col divide-y divide-border'>
              {plan.slice(0, PLAN_LIMIT).map(item => (
                <PlanRow key={`${item.game.appId}-${item.id}`} item={item} showGame={isMulti} />
              ))}
              {state.recent.slice(0, RECENT_SHOWN).map(item => (
                <RecentRow
                  key={`${item.appId}-${item.id}-${item.unlockedAtMs}`}
                  gameName={isMulti ? nameByAppId.get(item.appId) : undefined}
                  item={item}
                />
              ))}
            </div>
          </RunSection>
        )}
      </div>
      <QueuedGames state={state} />
      <CompletedGames state={state} />
    </>
  )
}
