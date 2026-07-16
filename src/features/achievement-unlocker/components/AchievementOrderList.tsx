import type { RowComponentProps } from 'react-window'
import type { OrderableAchievement } from '../hooks/useAchievementOrder'
import { useTranslation } from 'react-i18next'
import { TbHourglassLow } from 'react-icons/tb'
import { List } from 'react-window'
import { AchievementOrderRow } from './AchievementOrderRow'
import { NumberField, Typography } from '@heroui/react'

// AchievementOrderRow's intrinsic height (44px icon + 2 * 10px `py-2.5` padding + 2px border = 66)
// plus an 8px gap, carved out of each row's own slot via the `Row` wrapper's own `pb-2` below - the
// description line added below the name still fits under the 44px icon column (name + description
// text stack to ~36px), so the icon still drives the card's height, not the text. Unlike
// AchievementsList.tsx's row, AchievementOrderRow/DelayRow
// deliberately don't stretch to `h-full` (DragOverlay renders AchievementOrderRow outside this list
// entirely, with no defined parent height for a percentage height to resolve against, so it must
// size from its own content either way) - react-window needs a fixed row height known ahead of
// render, so a flex `gap` becomes per-row padding here instead (same tradeoff as
// VirtualizedGameGrid.tsx's GAP-via-cell-shrink, just via padding since react-window v2's `List`
// rows are single-column, not `Grid` cells). The delay-before-first-unlock row (index 0, see below)
// reuses the same height so `rowHeight` stays a single constant.
const ROW_HEIGHT = 74

interface DelayRowProps {
  delayBeforeFirstUnlock: number | ''
  isDisabled: boolean
  onDelayChange: (value: number | '') => void
}

// Scrolls with the achievement rows below it (not a pinned header) - it's the virtualized list's
// own index-0 row rather than a sibling element, so it moves out of view like any other row instead
// of staying fixed while the list scrolls beneath it. Styled as its own dashed-border card (rather
// than a real AchievementOrderRow card) precisely so it reads as "a setting", not a 6th achievement
// - the `mr-10` inner offset reproduces AchievementOrderRow.tsx's own gap(12px)+grabber-column(28px)
// inset so this row's input still lines up with every real row's delay input beneath it. Sizes
// itself naturally like AchievementOrderRow does (no `h-full`) - the gap comes entirely from the
// `Row` wrapper's own `pb-2` below, not from padding in here.
const DelayRow = ({ delayBeforeFirstUnlock, isDisabled, onDelayChange }: DelayRowProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-3 py-2.5 mt-2'>
      <TbHourglassLow className='shrink-0 text-muted' fontSize={18} />
      <div className='mr-10 flex flex-1 items-center justify-end gap-1.5'>
        <Typography type='body-xs'>
          {t('dashboard.achievementUnlocker.order.delayBeforeFirstUnlock')}
        </Typography>
        <NumberField
          aria-label={t('dashboard.achievementUnlocker.order.delayBeforeFirstUnlock')}
          className='w-36'
          formatOptions={{ maximumFractionDigits: 1, useGrouping: false }}
          isDisabled={isDisabled}
          minValue={0}
          step={0.1}
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

interface RowProps {
  achievements: OrderableAchievement[]
  appId: number
  delayBeforeFirstUnlock: number | ''
  isDelayDisabled: boolean
  onDelayChange: (value: number | '') => void
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// `ariaAttributes` go on this outer wrapper, not inside `AchievementOrderRow` itself - same
// reasoning as `AchievementsList.tsx`'s `Row`: an explicit `role` would otherwise override/strip
// AchievementOrderRow's own implicit roles (checkbox, drag handle) from the accessibility tree.
//
// Index 0 is the delay-before-first-unlock row, not an achievement - `achievements[index]` is
// offset by one everywhere below to account for it. It's deliberately not a sortable item (no
// `useSortable` call, no id in the parent's `SortableContext items` list in
// AchievementOrderOverlay.tsx) - there's nothing to reorder it against.
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

  const achievement = achievements[index - 1]
  if (!achievement) return null

  return (
    <div {...ariaAttributes} className='pb-2' style={style}>
      <AchievementOrderRow
        achievement={achievement}
        appId={appId}
        onSetDelay={onSetDelay}
        onToggleSkip={onToggleSkip}
      />
    </div>
  )
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
    rowHeight={ROW_HEIGHT}
    rowProps={props}
    style={{ height: '100%', width: '100%' }}
  />
)
