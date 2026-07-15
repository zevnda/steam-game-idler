import type { RowComponentProps } from 'react-window'
import type { AchievementDto } from '../types'
import { List } from 'react-window'
import { AchievementRow } from './AchievementRow'

// AchievementRow's intrinsic height (44px icon plus its corner-badge overhang and card padding
// comfortably fit within this, alongside `Row`'s own gap-before-next-card spacing below) -
// react-window needs row heights known ahead of render (unlike a plain `.map()`, which sizes
// itself from content), so this is a tuned constant mirroring VirtualizedGameGrid.tsx's own
// `INFO_HEIGHT`, not something measured at runtime.
const ROW_HEIGHT = 76

interface RowProps {
  achievements: AchievementDto[]
  appId: number
  pendingId: string | null
  selectedToLock: Set<string>
  selectedToUnlock: Set<string>
  onSelectChange: (achievement: AchievementDto, checked: boolean) => void
  onToggle: (achievementId: string, achieved: boolean) => void
}

// `ariaAttributes` go on this outer wrapper, not inside `AchievementRow` itself - same reasoning
// as `GameSettingsGameList.tsx`'s `Row`: an explicit `role` would otherwise override/strip
// `AchievementRow`'s own implicit roles (checkbox, button) from the accessibility tree.
const Row = ({
  ariaAttributes,
  index,
  style,
  achievements,
  appId,
  pendingId,
  selectedToLock,
  selectedToUnlock,
  onSelectChange,
  onToggle,
}: RowComponentProps<RowProps>) => {
  const achievement = achievements[index]
  if (!achievement) return null

  return (
    <div {...ariaAttributes} style={style} className='mt-2'>
      <AchievementRow
        achievement={achievement}
        appId={appId}
        isPending={pendingId === achievement.id}
        isSelected={
          achievement.achieved
            ? !selectedToLock.has(achievement.id)
            : selectedToUnlock.has(achievement.id)
        }
        onSelectChange={checked => onSelectChange(achievement, checked)}
        onToggle={() => onToggle(achievement.id, achievement.achieved)}
      />
    </div>
  )
}

interface AchievementsListProps {
  achievements: AchievementDto[]
  appId: number
  pendingId: string | null
  selectedToLock: Set<string>
  selectedToUnlock: Set<string>
  onSelectChange: (achievement: AchievementDto, checked: boolean) => void
  onToggle: (achievementId: string, achieved: boolean) => void
}

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
    rowCount={props.achievements.length}
    rowHeight={ROW_HEIGHT}
    rowProps={props}
    style={{ height: '100%', width: '100%' }}
  />
)
