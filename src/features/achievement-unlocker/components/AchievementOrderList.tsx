import type { RowComponentProps } from 'react-window'
import type { OrderableAchievement } from '../hooks/useAchievementOrder'
import { useTranslation } from 'react-i18next'
import { TbHourglassLow } from 'react-icons/tb'
import { List } from 'react-window'
import { AchievementOrderRow } from './AchievementOrderRow'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, NumberField, Typography } from '@heroui/react'

// AchievementOrderRow's intrinsic height (44px icon + 2 * 10px `py-2.5` padding + 2px border = 66)
// - the description line added below the name still fits under the 44px icon column (name +
// description text stack to ~36px), so the icon still drives the card's height, not the text. The
// delay-before-first-unlock row reuses this same height (see DelayRow below) so both card-shaped
// rows share one constant.
const CARD_HEIGHT = 66

// A NumberField.Group is a fixed `h-9` (36px, see @heroui/styles' number-field.css) - centered via
// `items-center` in ConnectorRow's `h-13` (52px) wrapper, that leaves an even ~8px above/below.
const CONNECTOR_HEIGHT = 52

// Achievement rows sit flush against each other (no gap) - each card's own trailing ConnectorRow
// already reads as belonging to it, so the *only* place a visible gap still makes sense is between
// the delay-before-first-unlock row and the achievement list below it (DelayRow is the one row with
// no connecting line, see its own doc comment). `pb-2` on that row's wrapper in `Row` below supplies
// the real CSS gap; this constant keeps `getRowHeight` in sync with it so react-window still
// allocates enough space for that padding instead of the row's content overflowing into it.
const DELAY_BEFORE_FIRST_GAP = 8

const DELAY_BEFORE_FIRST_ROW_HEIGHT = CARD_HEIGHT + DELAY_BEFORE_FIRST_GAP

interface DelayRowProps {
  delayBeforeFirstUnlock: number | ''
  isDisabled: boolean
  onDelayChange: (value: number | '') => void
}

// Scrolls with the achievement rows below it (not a pinned header) - it's the virtualized list's
// own index-0 row rather than a sibling element, so it moves out of view like any other row instead
// of staying fixed while the list scrolls beneath it. Styled as its own dashed-border card (rather
// than a real AchievementOrderRow card) precisely so it reads as "a setting", not a 6th achievement.
// Unlike ConnectorRow below, this one is a deliberate special case kept as-is: it only ever has one
// adjacent card (the first achievement), never two, so it needs no connecting line threaded through
// it. Its icon+label-on-the-left, stepper-on-the-right layout mirrors ConnectorRow's own instead -
// keep the two in sync (label placement, stepper width) since they read as siblings despite one
// being a bordered box and the other a bare connector. Sizes itself naturally like AchievementOrderRow
// does (no `h-full`) - the gap comes entirely from the `Row` wrapper's own `pb-2` below, not from
// padding in here.
const DelayRow = ({ delayBeforeFirstUnlock, isDisabled, onDelayChange }: DelayRowProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-3 py-2.5 mt-2'>
      <TbHourglassLow className='shrink-0 text-muted' fontSize={18} />
      <Typography type='body-xs'>
        {t('dashboard.achievementUnlocker.order.delayBeforeFirstUnlock')}
      </Typography>
      <div className='ml-auto flex shrink-0 items-center gap-1.5'>
        <NumberField
          aria-label={t('dashboard.achievementUnlocker.order.delayBeforeFirstUnlock')}
          className='w-42'
          formatOptions={{ maximumFractionDigits: 2, useGrouping: false }}
          isDisabled={isDisabled}
          minValue={0}
          step={0.01}
          value={delayBeforeFirstUnlock === '' ? NaN : delayBeforeFirstUnlock}
          onChange={value => onDelayChange(Number.isNaN(value) ? '' : value)}
        >
          <NumberField.Group className='bg-surface-secondary hover:bg-surface-hover text-foreground'>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
        <Typography color='muted' type='body-xs'>
          {t('common.minutes')}
        </Typography>
      </div>
    </div>
  )
}

interface ConnectorRowProps {
  achievementName: string
  delay: number | undefined
  isDisabled: boolean
  onDelayChange: (value: number | null) => void
}

// Sits in the gap between two achievement cards - `delayNextUnlock` is the wait time *after*
// unlocking the achievement above and *before* unlocking the one below, so it's a property of the
// transition, not of either card. The dashed vertical line is positioned under the cards' checkbox
// column (28px column + 12px `px-3` padding, centered = 26px) so it reads as running continuously
// from the bottom of the card above, through this row, to the top of the card below - achievement
// rows have no gap between them (see DELAY_BEFORE_FIRST_GAP above), so the line touches both
// neighboring cards exactly with nothing left unlined.
const ConnectorRow = ({ achievementName, delay, isDisabled, onDelayChange }: ConnectorRowProps) => {
  const { t } = useTranslation()

  return (
    <div className='relative flex h-13 items-center'>
      <span
        aria-hidden
        className='absolute top-0 bottom-0 left-6.5 border-l border-dashed border-border'
      />
      <div className='flex flex-1 items-center justify-between gap-2 pl-10 pr-3'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <TbHourglassLow className='shrink-0 text-muted' fontSize={14} />
          <Typography color='muted' type='body-xs'>
            {t('dashboard.achievementUnlocker.order.delayUntilNextUnlock')}
          </Typography>
        </div>
        <div className='flex shrink-0 items-center gap-1.5'>
          <NumberField
            className='w-42'
            formatOptions={{ maximumFractionDigits: 2, useGrouping: false }}
            isDisabled={isDisabled}
            minValue={0}
            step={0.01}
            value={delay ?? NaN}
            onChange={value => onDelayChange(Number.isNaN(value) ? null : value)}
          >
            <NumberField.Group className='bg-surface-secondary hover:bg-surface-hover text-foreground'>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
          <Typography color='muted' type='body-xs'>
            {t('common.minutes')}
          </Typography>
        </div>
      </div>
    </div>
  )
}

interface AchievementOrderUnitProps {
  achievement: OrderableAchievement
  appId: number
  hasConnector: boolean
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// One achievement's card plus (if there's a next achievement) the ConnectorRow for the delay after
// it, both under a single `useSortable` call/DOM node. This is deliberate: dnd-kit's live drag
// preview works by giving every sortable item its own `transform` that animates it toward its
// prospective new slot *while the drag is still in progress* - if the connector were its own,
// unrelated virtualized row (as it was before), it would have no such transform at all, so it would
// stay frozen in its old position for the whole drag and only jump to the right place once the
// array actually reordered on drop. Wrapping both under the achievement's own sortable node means
// they share that one transform, so the delay visibly travels with its achievement in real time
// instead of "snapping" after the fact - which also means reordering naturally carries
// `delayNextUnlock` along, since it's just the same achievement object moving in the array.
const AchievementOrderUnit = ({
  achievement,
  appId,
  hasConnector,
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
      <AchievementOrderRow
        achievement={achievement}
        appId={appId}
        dragHandleProps={{ attributes: sortable.attributes, listeners: sortable.listeners }}
        onToggleSkip={onToggleSkip}
      />
      {hasConnector && (
        <ConnectorRow
          achievementName={achievement.name}
          delay={achievement.delayNextUnlock}
          isDisabled={achievement.skip}
          onDelayChange={value => onSetDelay(achievement.id, value)}
        />
      )}
    </div>
  )
}

interface RowProps {
  achievements: OrderableAchievement[]
  appId: number
  delayBeforeFirstUnlock: number | ''
  isDelayDisabled: boolean
  onDelayChange: (value: number | '') => void
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// `ariaAttributes` go on this outer wrapper, not inside AchievementOrderUnit/AchievementOrderRow
// themselves - same reasoning as `AchievementsList.tsx`'s `Row`: an explicit `role` would otherwise
// override/strip AchievementOrderRow's own implicit roles (checkbox, drag handle) from the
// accessibility tree.
//
// Index 0 is the delay-before-first-unlock row (see DelayRow above). Every index after that is one
// AchievementOrderUnit - achievements[index - 1]'s card, plus its trailing connector unless it's the
// last achievement (nothing follows it, so no delay-after-it to show). Only achievements are
// sortable items (see AchievementOrderUnit's own `useSortable` call, and the parent's
// `SortableContext items` list in AchievementOrderOverlay.tsx) - the delay-before-first row isn't
// one of them, same special case as DelayRow's own doc comment describes.
const Row = ({
  ariaAttributes,
  index,
  style,
  achievements,
  appId,
  delayBeforeFirstUnlock,
  isDelayDisabled,
  onDelayChange,
  onToggleSkip,
  onSetDelay,
}: RowComponentProps<RowProps>) => {
  if (index === 0) {
    return (
      <div {...ariaAttributes} className='pb-2' style={style}>
        <DelayRow
          delayBeforeFirstUnlock={delayBeforeFirstUnlock}
          isDisabled={isDelayDisabled}
          onDelayChange={onDelayChange}
        />
      </div>
    )
  }

  const achievementIndex = index - 1
  const achievement = achievements[achievementIndex]
  if (!achievement) return null

  return (
    <div {...ariaAttributes} style={style}>
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
        hasConnector={achievementIndex < achievements.length - 1}
        onSetDelay={onSetDelay}
        onToggleSkip={onToggleSkip}
      />
    </div>
  )
}

// Row heights mirror `Row`'s own shape above: index 0 (delay-before-first) and the last achievement
// have no connector, every other achievement's row is a card plus a connector. Keep both in sync.
const getRowHeight = (index: number, { achievements }: RowProps) => {
  if (index === 0) return DELAY_BEFORE_FIRST_ROW_HEIGHT
  const hasConnector = index - 1 < achievements.length - 1
  return CARD_HEIGHT + (hasConnector ? CONNECTOR_HEIGHT : 0)
}

interface AchievementOrderListProps {
  achievements: OrderableAchievement[]
  appId: number
  delayBeforeFirstUnlock: number | ''
  isDelayDisabled: boolean
  onDelayChange: (value: number | '') => void
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// Virtualized replacement for the previous plain `.map()` of AchievementOrderRow - some games ship
// 300+ achievements (see AchievementsList.tsx's identical reasoning). Must render inside the parent
// DndContext/SortableContext (AchievementOrderOverlay.tsx owns both, since reordering needs to call
// back into useAchievementOrder's `reorder`) rather than owning them itself - only the currently
// mounted (visible) rows are real drop targets at any moment, dnd-kit's own documented tradeoff for
// combining virtualization with sortable lists; dragging near either edge of the visible window
// auto-scrolls the list (dnd-kit's default PointerSensor autoscroll targets the nearest scrollable
// ancestor, which is this `List`'s own root), bringing the next rows into range.
export const AchievementOrderList = (props: AchievementOrderListProps) => (
  <List
    rowComponent={Row}
    rowCount={props.achievements.length + 1}
    rowHeight={getRowHeight}
    rowProps={props}
    style={{ height: '100%', width: '100%' }}
  />
)
