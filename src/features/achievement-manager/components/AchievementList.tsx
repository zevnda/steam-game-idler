import type { RowComponentProps } from 'react-window'
import type { AchievementDto } from '../types'
import { List } from 'react-window'
import { isInGroups } from '../utils/groupAchievements'
import { AchievementListItem } from './AchievementListItem'

// AchievementListItem's card height (44px icon + padding) plus the gap below it - react-window
// needs row heights up front, so keep this in sync with that component if its content changes.
const ITEM_HEIGHT = 64
const GAP = 8

interface RowProps {
  achievements: AchievementDto[]
  // While FloatingActionBar is showing, extra bottom padding lets the last rows scroll clear of it.
  hasActionBar: boolean
  appId: number
  selectedIds: Set<string>
  dlcGroupIds: Set<number>
  unownedDlcGroupIds: Set<number>
  pendingId: string | null
  onSelectedChange: (achievement: AchievementDto) => void
  onQuickToggle: (achievement: AchievementDto) => void
}

// `px-6` and the gap (`pb-2`) live on each row's own block rather than on `List` itself -
// react-window positions rows absolutely, so padding on the List would be ignored horizontally (see
// VirtualizedGameGrid.tsx's top comment), while padding inside a full-width row is ordinary CSS.
const Row = ({
  ariaAttributes,
  index,
  style,
  achievements,
  appId,
  selectedIds,
  dlcGroupIds,
  unownedDlcGroupIds,
  pendingId,
  onSelectedChange,
  onQuickToggle,
}: RowComponentProps<RowProps>) => {
  const achievement = achievements[index]
  if (!achievement) return null

  return (
    <div {...ariaAttributes} className='px-6 pb-2' style={style}>
      <AchievementListItem
        achievement={achievement}
        appId={appId}
        isDlc={isInGroups(achievement, dlcGroupIds)}
        isPending={pendingId === achievement.id}
        isSelected={selectedIds.has(achievement.id)}
        isUnownedDlc={isInGroups(achievement, unownedDlcGroupIds)}
        onQuickToggle={() => onQuickToggle(achievement)}
        onSelectedChange={() => onSelectedChange(achievement)}
      />
    </div>
  )
}

// Virtualized single-column achievement list for AchievementsView.tsx - some games ship 300+
// achievements, so only the rows in view are mounted.
export const AchievementList = (props: RowProps) => (
  <List
    className={props.hasActionBar ? 'pb-24' : 'pb-4'}
    rowComponent={Row}
    rowCount={props.achievements.length}
    rowHeight={ITEM_HEIGHT + GAP}
    rowProps={props}
    style={{ height: '100%', width: '100%' }}
  />
)
