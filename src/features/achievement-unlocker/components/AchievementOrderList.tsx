import type { AchievementDto } from '@/features/achievement-manager/types'
import type { TranslationKey } from '@/i18n'
import type { ReactNode } from 'react'
import type { RowComponentProps } from 'react-window'
import type { OrderableAchievement } from '../hooks/useAchievementOrder'
import type { OrderTimeline } from '../utils/orderTimeline'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TbArchive,
  TbBan,
  TbFlagFilled,
  TbMinus,
  TbPlayerPlayFilled,
  TbShoppingCartX,
} from 'react-icons/tb'
import { List } from 'react-window'
import { formatTimeRange } from '../utils/orderTimeline'
import { AchievementOrderRow } from './AchievementOrderRow'
import { WaitChip } from './WaitChip'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, Skeleton, Typography } from '@heroui/react'
import { isInGroups } from '@/features/achievement-manager/utils/groupAchievements'
import { revealTitleIfTruncated } from '@/shared/utils/revealTitleIfTruncated'

// AchievementOrderRow's intrinsic height (44px icon + 2 * 10px `py-2.5` padding + 2px border = 66)
// - the description line below the name still fits under the 44px icon column, so the icon still
// drives the card's height, not the text.
const CARD_HEIGHT = 66

// The `h-11` strip under a card holding its WaitChip (a `h-7` chip, centered).
const WAIT_HEIGHT = 44

// Under a card with no wait after it (skipped, or the last included achievement) - just enough
// space that it doesn't touch the next card, with the timeline line still running through it.
const NO_WAIT_SPACER = 8

// StartRow: `pt-2` off the list's top edge, the start node's own `h-7` row (exactly its 28px
// node, no extra air), then the `h-11` strip holding the delay-before-first-unlock WaitChip. The
// node row being exactly node-height is what makes the node-to-chip gap the same 8px as every
// card-to-chip gap below it (a `h-7` chip centered in the `h-11` strip).
const START_ROW_HEIGHT = 8 + 28 + WAIT_HEIGHT

// EndRow's `h-14` - the line's last stretch plus the end node.
const END_ROW_HEIGHT = 56

// A read-only section's header row (see ReadOnlySectionHeaderRow below) - its label sits at the
// bottom of this height via `items-end pb-2`, so the space above the label is what visually
// separates the section from whatever's above it.
const READ_ONLY_HEADER_HEIGHT = 48

// Read-only cards aren't part of the timeline, so they get a plain `pb-2` gap between them.
const READ_ONLY_ROW_HEIGHT = CARD_HEIGHT + 8

// The timeline's left column: a dashed vertical line, optionally with a node centered on it.
// `line` trims the line for the two ends of the timeline (starts at the start node's center,
// ends at the end node's center) so it never dangles past either end. Every row sharing this
// fixed `w-9` column is what makes the separate virtualized rows read as one continuous line.
const Rail = ({
  line = 'full',
  children,
}: {
  line?: 'full' | 'fromCenter' | 'toCenter'
  children?: ReactNode
}) => (
  <div className='relative flex w-9 shrink-0 items-center justify-center self-stretch'>
    <span
      aria-hidden
      className={cn(
        'absolute left-1/2 -translate-x-1/2 border-l-2 border-dashed border-surface-tertiary',
        line === 'full' && 'inset-y-0',
        line === 'fromCenter' && 'top-1/2 bottom-0',
        line === 'toCenter' && 'top-0 bottom-1/2',
      )}
    />
    {children}
  </div>
)

// The step-number node on a card's rail - solid accent for an included achievement, a small
// muted dash for a skipped one (it has no step in the run). Exported for the drag overlay
// (AchievementOrderOverlay.tsx), which renders the card outside this list.
export const StepNode = ({ step }: { step: number | undefined }) =>
  step === undefined ? (
    <span className='relative flex size-5 items-center justify-center rounded-full bg-background text-muted ring-1 ring-surface-tertiary'>
      <TbMinus fontSize={10} />
    </span>
  ) : (
    <span className='relative flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground tabular-nums'>
      {step}
    </span>
  )

// A skeleton node sits on the rail's dashed line, so it gets an opaque backing - Skeleton's own
// fill is translucent, and the line would otherwise show straight through it.
const SkeletonNode = () => (
  <span className='relative rounded-full bg-background'>
    <Skeleton className='size-7 rounded-full' />
  </span>
)

// One skeleton wait chip, centered in its `h-11` strip like the real WaitChip.
const SkeletonWait = ({ width }: { width: string }) => (
  <div className='flex h-11 items-center gap-3'>
    <Rail />
    <div className='flex min-w-0 flex-1 justify-center'>
      <Skeleton className={cn('h-7 rounded-full', width)} />
    </div>
  </div>
)

// Loading placeholder for the whole timeline - built from the same Rail, row heights and card
// shell as the real thing (StartRow, AchievementOrderUnit, AchievementOrderRow's grid), so the
// layout doesn't jump when the data lands. Fixed count; the overlay's body clips any overflow.
// A plain block, not a flex column: in a height-limited flex column the fixed `h-*` rows would
// shrink to fit the body, squashing the wait strips (the real list doesn't hit this - react-window
// positions every row absolutely at its exact height).
export const AchievementOrderSkeleton = () => (
  <div className='overflow-hidden px-6 pt-2'>
    <div className='flex h-7 items-center gap-3'>
      <Rail line='fromCenter'>
        <SkeletonNode />
      </Rail>
      <Skeleton className='h-3.5 w-48 rounded-full' />
    </div>
    <SkeletonWait width='w-56' />
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index}>
        <div className='flex gap-3'>
          <Rail>
            <SkeletonNode />
          </Rail>
          <div className='grid h-16.5 min-w-0 flex-1 grid-cols-[28px_44px_1fr_auto_28px] items-center gap-3 rounded-xl border border-border bg-surface px-3'>
            <Skeleton className='mx-auto size-4.5 rounded-md' />
            <Skeleton className='size-11 rounded-lg' />
            <div className='flex min-w-0 flex-col gap-2'>
              <Skeleton className='h-3.5 w-48 max-w-full rounded-full' />
              <Skeleton className='h-3 w-72 max-w-full rounded-full' />
            </div>
            <div className='flex flex-col items-end gap-2'>
              <Skeleton className='h-2.5 w-16 rounded-full' />
              <Skeleton className='h-3 w-24 rounded-full' />
            </div>
            <Skeleton className='mx-auto h-5 w-2 rounded-full' />
          </div>
        </div>
        <SkeletonWait width='w-44' />
      </div>
    ))}
  </div>
)

interface StartRowProps {
  delayBeforeFirstUnlock: number | ''
  interval: [number, number] | null
  isDisabled: boolean
  onDelayChange: (value: number | '') => void
}

// The top of the timeline: where the clock starts, then the delay before the first unlock as the
// first wait on the line. Scrolls with the list (index 0 of the virtualized list) rather than
// staying pinned, and isn't a sortable item - nothing can be dragged above it.
const StartRow = ({
  delayBeforeFirstUnlock,
  interval,
  isDisabled,
  onDelayChange,
}: StartRowProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col pt-2'>
      <div className='flex h-7 items-center gap-3'>
        <Rail line='fromCenter'>
          <span className='relative flex size-7 items-center justify-center rounded-full bg-default text-foreground'>
            <TbPlayerPlayFilled fontSize={12} />
          </span>
        </Rail>
        <div className='flex min-w-0 flex-wrap items-center gap-x-2'>
          <Typography type='body-xs' weight='semibold'>
            {t('dashboard.achievementUnlocker.order.timeline.start')}
          </Typography>
        </div>
      </div>
      <div className='flex h-11 items-center gap-3'>
        <Rail />
        {/* Centered under the card column (not the full row), so it lines up with the cards. */}
        <div className='flex min-w-0 flex-1 justify-center'>
          <WaitChip
            interval={interval}
            isDisabled={isDisabled}
            kind='first'
            value={delayBeforeFirstUnlock === '' ? undefined : delayBeforeFirstUnlock}
            onChange={value => onDelayChange(value ?? '')}
          />
        </div>
      </div>
    </div>
  )
}

// The bottom of the timeline - closes the line off so the last card doesn't read as cut off.
const EndRow = () => {
  const { t } = useTranslation()

  return (
    <div className='flex h-14 items-center gap-3'>
      <Rail line='toCenter'>
        <span className='relative flex size-7 items-center justify-center rounded-full bg-default text-foreground'>
          <TbFlagFilled fontSize={12} />
        </span>
      </Rail>
      <Typography type='body-xs' weight='semibold'>
        {t('dashboard.achievementUnlocker.order.timeline.end')}
      </Typography>
    </div>
  )
}

interface AchievementOrderUnitProps {
  achievement: OrderableAchievement
  appId: number
  isDlc: boolean
  step: number | undefined
  unlocksAt: string | undefined
  // Name of the next included achievement - set only when this achievement's wait actually runs
  // (see orderTimeline.ts's `nextNameById`), which is also what decides whether its WaitChip shows.
  nextName: string | undefined
  interval: [number, number] | null
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// One achievement's card plus the wait after it, under a single `useSortable` call/DOM node. This
// is deliberate: dnd-kit's live drag preview gives every sortable item its own `transform` that
// animates it toward its prospective slot *while the drag is in progress* - if the wait were its
// own unrelated virtualized row, it would stay frozen in place for the whole drag and only jump
// once the array reordered on drop. Sharing the achievement's sortable node means the wait visibly
// travels with its achievement, and reordering naturally carries `delayNextUnlock` along, since
// it's the same achievement object moving in the array.
const AchievementOrderUnit = ({
  achievement,
  appId,
  isDlc,
  step,
  unlocksAt,
  nextName,
  interval,
  onToggleSkip,
  onSetDelay,
}: AchievementOrderUnitProps) => {
  const sortable = useSortable({ id: achievement.id })

  return (
    <div
      ref={sortable.setNodeRef}
      className={cn(sortable.isDragging && 'opacity-0')}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
    >
      <div className='flex gap-3'>
        <Rail>
          <StepNode step={step} />
        </Rail>
        <div className='min-w-0 flex-1'>
          <AchievementOrderRow
            achievement={achievement}
            appId={appId}
            dragHandleProps={{ attributes: sortable.attributes, listeners: sortable.listeners }}
            isDlc={isDlc}
            isSkipped={achievement.skip}
            unlocksAt={unlocksAt}
            onToggleSkip={onToggleSkip}
          />
        </div>
      </div>
      {nextName !== undefined ? (
        <div className='flex h-11 items-center gap-3'>
          <Rail />
          {/* Centered under the card column (not the full row), so it lines up with the cards. */}
          <div className='flex min-w-0 flex-1 justify-center'>
            <WaitChip
              interval={interval}
              kind='next'
              nextName={nextName}
              value={achievement.delayNextUnlock}
              onChange={value => onSetDelay(achievement.id, value ?? null)}
            />
          </div>
        </div>
      ) : (
        <div className='flex h-2 gap-3'>
          <Rail />
        </div>
      )}
    </div>
  )
}

type ReadOnlyReason = 'protected' | 'unownedDlc' | 'archived'

const READ_ONLY_SECTION_TITLE_KEYS = {
  protected: 'dashboard.achievementUnlocker.order.protectedSection.title',
  unownedDlc: 'dashboard.achievementUnlocker.order.unownedDlcSection.title',
  archived: 'dashboard.achievementUnlocker.order.archivedSection.title',
} as const satisfies Record<ReadOnlyReason, TranslationKey>

const READ_ONLY_SECTION_ICONS = {
  protected: TbBan,
  unownedDlc: TbShoppingCartX,
  archived: TbArchive,
} as const

// Everything after the real order: one read-only section per reason an achievement can't be part
// of it - protected first, then unowned DLC, then archived - each a header plus one plain card per
// achievement. Precomputed once per render of AchievementOrderList (not per Row) since Row and
// getRowHeight both index into it.
type TrailingRow =
  | { type: 'header'; reason: ReadOnlyReason; count: number }
  | { type: 'card'; reason: ReadOnlyReason; achievement: AchievementDto }

// Labels one read-only section below the timeline. Indented to line up with the timeline's cards
// (`pl-12` = the rail's `w-9` + `gap-3`) but with no rail of its own - these achievements aren't
// part of the unlock sequence at all (see useAchievementOrder.ts's `protectedAchievements`/
// `unownedDlcAchievements`), so nothing here should read as a step in it. The title is the
// explanation for unowned DLC and archived; for protected, the longer *why* lives in a tooltip on
// each card's marker and the header alert in AchievementOrderHeader.tsx, since this row has a
// fixed virtualized height and a wrapping description would overflow it in longer locales.
const ReadOnlySectionHeaderRow = ({ reason, count }: { reason: ReadOnlyReason; count: number }) => {
  const { t } = useTranslation()
  const Icon = READ_ONLY_SECTION_ICONS[reason]

  return (
    <div className='flex h-full items-end gap-2 pb-2 pl-12'>
      <Icon
        className={cn('mb-0.5 shrink-0', reason === 'protected' ? 'text-warning' : 'text-muted')}
        fontSize={14}
      />
      {/* Stays single-line (fixed virtualized row height, see above) - the full title is
          recoverable on hover instead when a longer locale clips it. */}
      <Typography truncate type='body-xs' weight='semibold' onMouseEnter={revealTitleIfTruncated}>
        {t(READ_ONLY_SECTION_TITLE_KEYS[reason])}
      </Typography>
      <span className='shrink-0 rounded-full bg-surface-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted'>
        {count}
      </span>
    </div>
  )
}

interface RowProps {
  achievements: OrderableAchievement[]
  trailingRows: TrailingRow[]
  timeline: OrderTimeline
  interval: [number, number] | null
  dlcGroupIds: Set<number>
  appId: number
  delayBeforeFirstUnlock: number | ''
  isDelayDisabled: boolean
  onDelayChange: (value: number | '') => void
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// Row layout: while there's an order to show, index 0 is StartRow, then one AchievementOrderUnit
// per achievement, then EndRow; the `trailingRows` read-only sections follow. With no orderable
// achievements at all (only read-only ones), the start/end rows are left out - a timeline with
// nothing on it would just be noise above the read-only sections. Keep `getRowHeight` below in
// sync with this.
const timelineRowCount = (achievements: OrderableAchievement[]) =>
  achievements.length > 0 ? achievements.length + 2 : 0

// Every row wrapper carries the list's `px-6` side padding itself (the read-only card's `pl-18` is
// that plus the timeline's `pl-12` indent) rather than the overlay's Modal.Body padding the List -
// padding outside the List would inset its scroll container, leaving the scrollbar floating 24px
// in from the modal's edge instead of sitting at it.
//
// `ariaAttributes` go on this outer wrapper, not inside AchievementOrderUnit/AchievementOrderRow
// themselves - same reasoning as `AchievementsList.tsx`'s `Row`: an explicit `role` would otherwise
// override/strip AchievementOrderRow's own implicit roles (checkbox, drag handle) from the
// accessibility tree.
const Row = ({
  ariaAttributes,
  index,
  style,
  achievements,
  trailingRows,
  timeline,
  interval,
  dlcGroupIds,
  appId,
  delayBeforeFirstUnlock,
  isDelayDisabled,
  onDelayChange,
  onToggleSkip,
  onSetDelay,
}: RowComponentProps<RowProps>) => {
  const { t } = useTranslation()
  const timelineRows = timelineRowCount(achievements)

  if (index >= timelineRows) {
    const trailing = trailingRows[index - timelineRows]
    if (!trailing) return null
    if (trailing.type === 'header') {
      return (
        <div {...ariaAttributes} className='px-6' style={style}>
          <ReadOnlySectionHeaderRow count={trailing.count} reason={trailing.reason} />
        </div>
      )
    }
    return (
      <div {...ariaAttributes} className='pr-6 pb-2 pl-18' style={style}>
        <AchievementOrderRow
          achievement={trailing.achievement}
          appId={appId}
          isDlc={isInGroups(trailing.achievement, dlcGroupIds)}
          readOnlyReason={trailing.reason}
        />
      </div>
    )
  }

  if (index === 0) {
    return (
      <div {...ariaAttributes} className='px-6' style={style}>
        <StartRow
          delayBeforeFirstUnlock={delayBeforeFirstUnlock}
          interval={interval}
          isDisabled={isDelayDisabled}
          onDelayChange={onDelayChange}
        />
      </div>
    )
  }

  if (index === timelineRows - 1) {
    return (
      <div {...ariaAttributes} className='px-6' style={style}>
        <EndRow />
      </div>
    )
  }

  const achievement = achievements[index - 1]
  if (!achievement) return null
  const step = timeline.steps.get(achievement.id)
  // No estimate until the Unlock interval loads - without it, any random wait would count as 0
  // and the time shown would be wrong rather than merely missing.
  const unlocksAt = step && interval ? formatTimeRange(t, step.earliest, step.latest) : undefined

  return (
    <div {...ariaAttributes} className='px-6' style={style}>
      {/* Keyed by achievement id, not just positioned by react-window's own row index on this Row -
          react-window recycles a row's DOM node across renders of the same list slot, so without
          this key a reorder would leave the *same* AchievementOrderUnit instance (and its
          useSortable hook) silently rebound to a different achievement's id with no remount, which
          briefly renders with the transform meant for the old achievement and reads as a
          snap-back-then-correct glitch right after dropping - same fix as
          AchievementUnlockerListGrid.tsx's Cell. */}
      <AchievementOrderUnit
        key={achievement.id}
        achievement={achievement}
        appId={appId}
        interval={interval}
        isDlc={isInGroups(achievement, dlcGroupIds)}
        nextName={timeline.nextNameById.get(achievement.id)}
        step={step?.step}
        unlocksAt={unlocksAt}
        onSetDelay={onSetDelay}
        onToggleSkip={onToggleSkip}
      />
    </div>
  )
}

// Mirrors `Row`'s shape above - keep both in sync.
const getRowHeight = (index: number, { achievements, trailingRows, timeline }: RowProps) => {
  const timelineRows = timelineRowCount(achievements)
  if (index >= timelineRows) {
    return trailingRows[index - timelineRows]?.type === 'header'
      ? READ_ONLY_HEADER_HEIGHT
      : READ_ONLY_ROW_HEIGHT
  }
  if (index === 0) return START_ROW_HEIGHT
  if (index === timelineRows - 1) return END_ROW_HEIGHT
  const achievement = achievements[index - 1]
  const hasWait = achievement !== undefined && timeline.nextNameById.has(achievement.id)
  return CARD_HEIGHT + (hasWait ? WAIT_HEIGHT : NO_WAIT_SPACER)
}

interface AchievementOrderListProps extends Omit<RowProps, 'trailingRows'> {
  protectedAchievements: AchievementDto[]
  unownedDlcAchievements: AchievementDto[]
  archivedAchievements: AchievementDto[]
}

// The order editor drawn as a vertical timeline: a start node, then each achievement as a
// numbered step with the wait before the next one drawn on the line between them, then an end
// node. Virtualized - some games ship 300+ achievements (see AchievementsList.tsx's identical
// reasoning). Must render inside the parent DndContext/SortableContext (AchievementOrderOverlay.tsx
// owns both, since reordering needs to call back into useAchievementOrder's `reorder`) rather than
// owning them itself - only the currently mounted (visible) rows are real drop targets at any
// moment, dnd-kit's own documented tradeoff for combining virtualization with sortable lists;
// dragging near either edge of the visible window auto-scrolls the list (dnd-kit's default
// PointerSensor autoscroll targets the nearest scrollable ancestor, which is this `List`'s own
// root), bringing the next rows into range. Protected, unowned-DLC and archived achievements
// render as trailing rows after the timeline (see TrailingRow), outside the parent
// SortableContext's `items` - they're never drag sources or targets.
export const AchievementOrderList = ({
  protectedAchievements,
  unownedDlcAchievements,
  archivedAchievements,
  ...props
}: AchievementOrderListProps) => {
  const trailingRows = useMemo(() => {
    const rows: TrailingRow[] = []
    const sections: [ReadOnlyReason, AchievementDto[]][] = [
      ['protected', protectedAchievements],
      ['unownedDlc', unownedDlcAchievements],
      ['archived', archivedAchievements],
    ]
    for (const [reason, list] of sections) {
      if (list.length === 0) continue
      rows.push({ type: 'header', reason, count: list.length })
      for (const achievement of list) rows.push({ type: 'card', reason, achievement })
    }
    return rows
  }, [protectedAchievements, unownedDlcAchievements, archivedAchievements])

  return (
    <List
      rowComponent={Row}
      rowCount={timelineRowCount(props.achievements) + trailingRows.length}
      rowHeight={getRowHeight}
      rowProps={{ ...props, trailingRows }}
      style={{ height: '100%', width: '100%' }}
    />
  )
}
