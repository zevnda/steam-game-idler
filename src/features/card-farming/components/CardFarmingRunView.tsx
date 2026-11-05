import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { CompletedFarm, FarmingProgress, FarmingState, GameWithDrops } from '../types'
import { useTranslation } from 'react-i18next'
import { TbCheck } from 'react-icons/tb'
import { cn, ProgressBar, Skeleton } from '@heroui/react'
import { GamePosterCard } from '@/shared/components/GamePosterCard'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { RunHero, RunHeroCard } from '@/shared/components/running/RunHero'
import { RunSection, RunSummary, StatTile, StatTiles } from '@/shared/components/running/RunPanels'
import { useNow } from '@/shared/hooks/useNow'
import { usePlayingSessionStore } from '@/shared/stores/playingSessionStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { formatDuration } from '@/shared/utils/formatDuration'

// Card Farming's running screen content - the Overview and Details tabs RunScreen hosts (see
// CardFarmingPage). Everything here is display only: farming itself runs in the backend
// (`card_farming::manager`), and this reads the state it publishes.
//
// Two phases (see `card_farming::mod::Phase`): while farming ready games, a game's progress is its
// card drops; while building playtime (nothing has reached the account's playtime threshold yet),
// no cards are being chased, so progress is playtime toward that threshold instead. Showing a
// drops bar then would imply progress toward something that isn't happening.

// More pips than this stop reading as individual cards, so a bar takes over
const MAX_PIPS = 12

// Cards as little card shapes, filled as they drop
const CardPips = ({ total, left, size }: { total: number; left: number; size: 'lg' | 'sm' }) => {
  const dropped = Math.max(0, total - left)
  if (total > MAX_PIPS) {
    return (
      <ProgressBar aria-hidden className='w-40' maxValue={total} minValue={0} value={dropped}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    )
  }
  return (
    <div aria-hidden className='flex shrink-0 gap-1.5'>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            'rounded-[4px] border',
            size === 'lg' ? 'h-7.5 w-5.5' : 'h-4 w-3',
            index < dropped
              ? 'border-transparent bg-accent shadow-[0_4px_14px_color-mix(in_oklab,var(--accent)_45%,transparent)]'
              : 'border-white/25 bg-white/5',
          )}
        />
      ))}
    </div>
  )
}

const isReady = (playtimeHours: number, threshold?: number) =>
  threshold === undefined || playtimeHours >= threshold

// "Waiting its turn" or "1.2h / 3h until farmable" - the existing queue strings
const queuedText = (t: TFunction, game: GameWithDrops, threshold?: number) =>
  isReady(game.playtimeHours, threshold)
    ? t('dashboard.cardFarming.progress.waitingTurn')
    : t('dashboard.cardFarming.progress.accumulatingPlaytime', {
        hours: game.playtimeHours.toFixed(1),
        threshold,
      })

const formatFarmableAt = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

// Why a game left the session. A real finish is just a tick; every other reason is spelled out,
// since those aren't successes and would otherwise look identical to one.
const CompletedReason = ({ game }: { game: CompletedFarm }) => {
  const { t } = useTranslation()
  if (game.reason === 'dropsExhausted') {
    return <TbCheck aria-hidden className='shrink-0 text-success' fontSize={16} />
  }
  const text =
    game.reason === 'refundWindow'
      ? t('dashboard.cardFarming.progress.completedRefundWindow', {
          date: game.farmableAt ? formatFarmableAt(game.farmableAt) : '',
        })
      : game.reason === 'skippedUnplayed'
        ? t('dashboard.cardFarming.progress.completedSkippedUnplayed')
        : game.reason === 'skippedPlayed'
          ? t('dashboard.cardFarming.progress.completedSkippedPlayed')
          : game.reason === 'maxPlaytime'
            ? t('dashboard.achievementUnlocker.progress.completedMaxPlaytime')
            : t('dashboard.cardFarming.progress.completedNoDropsRemaining')
  return <span className='text-xs text-muted'>{text}</span>
}

// What a game being worked on shows under its title: its cards, or its playtime while building it
const ActiveProgress = ({
  game,
  isBuildingPlaytime,
  threshold,
  size,
}: {
  game: FarmingProgress
  isBuildingPlaytime: boolean
  threshold?: number
  size: 'lg' | 'sm'
}) => {
  const { t } = useTranslation()
  if (isBuildingPlaytime && threshold !== undefined) {
    const text = t('dashboard.cardFarming.progress.accumulatingPlaytime', {
      hours: game.playtimeHours.toFixed(1),
      threshold,
    })
    return (
      <div className={cn('flex flex-col', size === 'lg' ? 'max-w-110 gap-2' : 'gap-1.5')}>
        <span className={cn('font-bold tabular-nums', size === 'lg' ? 'text-xl' : 'text-xs')}>
          {text}
        </span>
        <ProgressBar
          aria-label={text}
          color='warning'
          maxValue={threshold}
          minValue={0}
          value={Math.min(game.playtimeHours, threshold)}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    )
  }
  return (
    <div
      className={cn(
        'flex items-center',
        size === 'lg' ? 'flex-wrap gap-4' : 'justify-between gap-2',
      )}
    >
      <CardPips left={game.remaining} size={size} total={game.initialRemaining} />
      <span className={cn('font-bold tabular-nums', size === 'lg' ? 'text-xl' : 'text-xs')}>
        {t('dashboard.cardFarming.progress.dropsRemaining', { count: game.remaining })}
      </span>
    </div>
  )
}

const totals = (state: FarmingState) => {
  const left =
    state.active.reduce((sum, game) => sum + game.remaining, 0) +
    state.queue.reduce((sum, game) => sum + game.remaining, 0)
  return { dropped: state.cardsDropped, left }
}

interface CardFarmingRunViewProps {
  state: FarmingState
  // The account's playtime threshold - labels building-playtime games. Undefined while loading.
  hoursUntilFarmable?: number
}

// ---------- Overview ----------

export const CardFarmingOverview = ({ state, hoursUntilFarmable }: CardFarmingRunViewProps) => {
  const { t } = useTranslation()
  const isBuildingPlaytime = state.phase === 'bulkIdle'
  const { dropped, left } = totals(state)

  let banner: ReactNode = null
  if (state.active.length === 1) {
    const game = state.active[0]
    banner = (
      <RunHero
        appId={game.appId}
        heading={t('dashboard.achievementUnlocker.progress.currentGame')}
        name={game.name}
      >
        <ActiveProgress
          game={game}
          isBuildingPlaytime={isBuildingPlaytime}
          size='lg'
          threshold={hoursUntilFarmable}
        />
      </RunHero>
    )
  } else if (state.active.length > 1) {
    banner = (
      <div className='flex flex-col gap-3'>
        <h3 className='font-bold'>
          {t(
            isBuildingPlaytime
              ? 'dashboard.cardFarming.progress.activeTitleBulkIdle'
              : 'dashboard.cardFarming.progress.activeTitleReadyFarm',
            { count: state.active.length },
          )}
        </h3>
        <div className='grid grid-cols-4 gap-3 @max-5xl:grid-cols-3 @max-3xl:grid-cols-2'>
          {state.active.map(game => (
            <RunHeroCard key={game.appId} appId={game.appId} name={game.name}>
              <ActiveProgress
                game={game}
                isBuildingPlaytime={isBuildingPlaytime}
                size='sm'
                threshold={hoursUntilFarmable}
              />
            </RunHeroCard>
          ))}
        </div>
      </div>
    )
  } else if (state.isFarming && state.completed.length === 0) {
    // The first pass is still reading the badge pages - the banner's space, held for it
    banner = <Skeleton className='h-78 rounded-2xl @max-3xl:h-64' />
  }

  return (
    <>
      {banner}
      <RunSummary
        done={dropped}
        doneLabel={t('dashboard.cardFarming.progress.droppedThisSession')}
        left={left}
        leftLabel={t('dashboard.cardFarming.progress.stillToDrop')}
        progressText={t('dashboard.cardFarming.progress.cardsProgress', {
          done: dropped.toLocaleString(),
          total: (dropped + left).toLocaleString(),
        })}
      />
      {(state.queue.length > 0 || state.completed.length > 0) && (
        <div className='flex flex-col gap-3'>
          {state.queue.length > 0 && (
            <h3 className='font-bold'>
              {t('dashboard.cardFarming.progress.queueTitle', { count: state.queue.length })}
            </h3>
          )}
          <div className='game-grid'>
            {state.queue.map(game => {
              const ready = isReady(game.playtimeHours, hoursUntilFarmable)
              return (
                <GamePosterCard
                  key={game.appId}
                  appId={game.appId}
                  isAlwaysRevealed
                  isDimmed={!ready}
                  meta={
                    <div className='flex flex-col gap-1.5'>
                      <CardPips left={game.remaining} size='sm' total={game.remaining} />
                      <span className={cn(!ready && 'text-warning')}>
                        {queuedText(t, game, hoursUntilFarmable)}
                      </span>
                    </div>
                  }
                  name={game.name}
                />
              )
            })}
            {state.completed.length > 0 && (
              <RunSection
                className='col-span-2'
                title={t('common.completedThisSessionCount', { count: state.completed.length })}
              >
                <CompletedList games={state.completed} />
              </RunSection>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const CompletedList = ({ games }: { games: CompletedFarm[] }) => (
  <div className='flex flex-col gap-3'>
    {games.map(game => (
      <div key={game.appId} className='flex items-center gap-3'>
        <div className='w-16 shrink-0'>
          <GameThumbnail appId={game.appId} name={game.name} />
        </div>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='truncate text-sm font-semibold' title={game.name}>
            {game.name}
          </span>
          <CompletedReason game={game} />
        </div>
      </div>
    ))}
  </div>
)

// ---------- Details ----------

// The next badge-page check: a countdown, "Paused" while another session on the account is playing
// a game (no drops accrue then), or a dash when nothing is scheduled (between passes, or finished).
const NextCheckValue = ({ nextCheckAtMs }: { nextCheckAtMs: number | null }) => {
  const { t } = useTranslation()
  const now = useNow()
  const activeKey = useSessionStore(state => state.activeAccountKey)
  const isPaused = usePlayingSessionStore(state => Boolean(activeKey && state.entries[activeKey]))
  if (isPaused) return <>{t('common.status.paused')}</>
  if (nextCheckAtMs === null) return <>—</>
  return <span className='font-mono'>{formatDuration((nextCheckAtMs - now) / 1000)}</span>
}

export const CardFarmingDetails = ({ state, hoursUntilFarmable }: CardFarmingRunViewProps) => {
  const { t } = useTranslation()
  const isBuildingPlaytime = state.phase === 'bulkIdle'
  const { dropped, left } = totals(state)

  return (
    <>
      <StatTiles>
        <StatTile
          label={t('dashboard.cardFarming.progress.droppedThisSession')}
          value={dropped.toLocaleString()}
          valueClassName='text-success'
        />
        <StatTile
          label={t('dashboard.cardFarming.progress.stillToDrop')}
          value={left.toLocaleString()}
        />
        <StatTile
          label={t('dashboard.cardFarming.progress.nextDropCheck')}
          value={<NextCheckValue nextCheckAtMs={state.isFarming ? state.nextCheckAtMs : null} />}
        />
      </StatTiles>

      <div className='grid grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-4 @max-4xl:grid-cols-1'>
        {state.active.length > 0 && (
          <RunSection
            title={t(
              isBuildingPlaytime
                ? 'dashboard.cardFarming.progress.activeTitleBulkIdle'
                : 'dashboard.cardFarming.progress.activeTitleReadyFarm',
              { count: state.active.length },
            )}
            className='self-start'
          >
            {state.active.map(game => (
              <div key={game.appId} className='flex flex-col gap-2.5 rounded-xl bg-default/60 p-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-20 shrink-0'>
                    <GameThumbnail appId={game.appId} name={game.name} />
                  </div>
                  <span className='min-w-0 flex-1 truncate text-sm font-semibold' title={game.name}>
                    {game.name}
                  </span>
                </div>
                <ActiveProgress
                  game={game}
                  isBuildingPlaytime={isBuildingPlaytime}
                  size='sm'
                  threshold={hoursUntilFarmable}
                />
              </div>
            ))}
          </RunSection>
        )}

        <div
          className={cn(
            'flex min-w-0 flex-col gap-4',
            state.active.length === 0 && 'col-span-full',
          )}
        >
          {state.queue.length > 0 && (
            <RunSection
              title={t('dashboard.cardFarming.progress.queueTitle', { count: state.queue.length })}
            >
              <div className='flex flex-col divide-y divide-border'>
                {state.queue.map((game, index) => {
                  const ready = isReady(game.playtimeHours, hoursUntilFarmable)
                  return (
                    <div
                      key={game.appId}
                      className='flex items-center gap-3 py-2.5 first:pt-0 last:pb-0'
                    >
                      <span className='w-5 shrink-0 text-sm tabular-nums text-muted'>
                        {index + 1}
                      </span>
                      <div className='w-18 shrink-0 @max-3xl:hidden'>
                        <GameThumbnail appId={game.appId} name={game.name} />
                      </div>
                      <span
                        className='min-w-0 flex-1 truncate text-sm font-semibold'
                        title={game.name}
                      >
                        {game.name}
                      </span>
                      <span
                        className={cn('shrink-0 text-xs', ready ? 'text-muted' : 'text-warning')}
                      >
                        {queuedText(t, game, hoursUntilFarmable)}
                      </span>
                      <span className='w-32 shrink-0 text-right text-xs tabular-nums text-muted @max-3xl:hidden'>
                        {t('dashboard.cardFarming.progress.dropsRemaining', {
                          count: game.remaining,
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </RunSection>
          )}
          {state.completed.length > 0 && (
            <RunSection
              title={t('common.completedThisSessionCount', { count: state.completed.length })}
            >
              <CompletedList games={state.completed} />
            </RunSection>
          )}
        </div>
      </div>
    </>
  )
}
