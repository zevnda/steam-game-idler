import type { RowComponentProps } from 'react-window'
import type { AchievementDto } from '../types'
import type { AchievementSection } from '../utils/groupAchievements'
import { List } from 'react-window'
import { AchievementRow } from './AchievementRow'
import { AchievementSetHeader, setPanelClasses } from './AchievementSetHeader'
import { cn } from '@heroui/react'

// AchievementRow's intrinsic height (44px icon plus its corner-badge overhang and card padding
// comfortably fit within this, alongside `Row`'s own gap-before-next-card spacing below) -
// react-window needs row heights known ahead of render (unlike a plain `.map()`, which sizes
// itself from content), so this is a tuned constant mirroring VirtualizedGameGrid.tsx's own
// `INFO_HEIGHT`, not something measured at runtime.
const ROW_HEIGHT = 76

// AchievementSetHeader's row: a `pt-4` gap separating this set's panel from the previous one, plus
// the 64px header itself (40px art + `py-3`). Keep in sync with `Row`'s header branch below.
const SET_HEADER_ROW_HEIGHT = 80

// The flattened, virtualizable shape of AchievementsTab.tsx's grouped view: a set header followed
// by its (non-collapsed) achievements, repeated per set. An achievement inside a set carries that
// `section` so its row can draw its slice of the set's panel (side borders + tint), and the set's
// last row closes the panel off. A game without Achievement Sets is just a run of `achievement`
// items with no `section` and no headers at all, exactly as before sets existed.
export type AchievementListItem =
  | { type: 'set'; section: AchievementSection; isCollapsed: boolean }
  | {
      type: 'achievement'
      achievement: AchievementDto
      section?: AchievementSection
      isLastInSection?: boolean
    }

interface RowProps {
  items: AchievementListItem[]
  appId: number
  pendingId: string | null
  selectedToLock: Set<string>
  selectedToUnlock: Set<string>
  onSelectChange: (achievement: AchievementDto, checked: boolean) => void
  onToggle: (achievementId: string, achieved: boolean) => void
  onToggleSet: (sectionKey: number) => void
}

// `ariaAttributes` go on this outer wrapper, not inside `AchievementRow` itself - same reasoning
// as `GameSettingsGameList.tsx`'s `Row`: an explicit `role` would otherwise override/strip
// `AchievementRow`'s own implicit roles (checkbox, button) from the accessibility tree.
const Row = ({
  ariaAttributes,
  index,
  style,
  items,
  appId,
  pendingId,
  selectedToLock,
  selectedToUnlock,
  onSelectChange,
  onToggle,
  onToggleSet,
}: RowComponentProps<RowProps>) => {
  const item = items[index]
  if (!item) return null

  if (item.type === 'set') {
    return (
      <div {...ariaAttributes} style={style} className='pt-4'>
        <AchievementSetHeader
          isCollapsed={item.isCollapsed}
          section={item.section}
          onToggle={() => onToggleSet(item.section.key)}
        />
      </div>
    )
  }

  const { achievement, section, isLastInSection } = item
  const row = (
    <AchievementRow
      achievement={achievement}
      appId={appId}
      isPending={pendingId === achievement.id}
      isUnownedDlc={section?.isUnownedDlc}
      isSelected={
        achievement.achieved
          ? !selectedToLock.has(achievement.id)
          : selectedToUnlock.has(achievement.id)
      }
      onSelectChange={checked => onSelectChange(achievement, checked)}
      onToggle={() => onToggle(achievement.id, achievement.achieved)}
    />
  )

  // Inside a set: this row's slice of the set's panel - side borders and tint, with the card inset
  // by `px-2`. No `mt-2` here (unlike the flat case) so slices butt together into one unbroken
  // panel; AchievementRow's own `pb-2` supplies the gap between cards, and below the last card it
  // doubles as the panel's bottom padding before `border-b` closes it.
  if (section) {
    return (
      <div {...ariaAttributes} style={style}>
        <div
          className={cn(
            'h-full border-x px-2',
            setPanelClasses(section),
            isLastInSection && 'rounded-b-xl border-b',
          )}
        >
          {row}
        </div>
      </div>
    )
  }

  return (
    <div {...ariaAttributes} style={style} className='mt-2'>
      {row}
    </div>
  )
}

const getRowHeight = (index: number, { items }: RowProps) =>
  items[index]?.type === 'set' ? SET_HEADER_ROW_HEIGHT : ROW_HEIGHT

type AchievementsListProps = RowProps

// Virtualized replacement for a plain `.map()` of `AchievementRow` - some games ship 300+
// achievements (sports/management titles especially), which is real enough to warrant it.
// `react-window` v2's
// `List` (not `Grid` - see `VirtualizedGameGrid.tsx`) since this is a single-column flat list, the
// same shape `GameSettingsGameList.tsx` already uses. Deliberately no horizontal padding on `List`
// itself or its own wrapping div - react-window sets each row's `left` explicitly, and CSS
// resolves absolute-position offsets against the *padding edge* of the element `List` itself
// renders, not any padding on that element (see `VirtualizedGameGrid.tsx`'s "Horizontal is the
// opposite problem" comment for the full explanation) - so any horizontal inset must come from an
// ancestor further up (`AchievementsTab.tsx`'s `AchievementManagerOverlay.tsx` padding), never
// from padding applied directly here.
export const AchievementsList = (props: AchievementsListProps) => (
  <List
    rowComponent={Row}
    rowCount={props.items.length}
    rowHeight={getRowHeight}
    rowProps={props}
    style={{ height: '100%', width: '100%' }}
  />
)
