import type { RowComponentProps } from 'react-window'
import type { StatDto } from '../types'
import { List } from 'react-window'
import { StatisticRow } from './StatisticRow'

// StatisticRow's height: a single-line row (no icon, no flags line), so a little shorter than
// AchievementList.tsx's rows - a 56px card around the 36px value field, plus the shared 8px row
// gap. A tuned constant, not measured: react-window needs row heights before render.
const ROW_HEIGHT = 64

interface RowProps {
  stats: StatDto[]
  edits: Record<string, number>
  onChange: (stat: StatDto, value: number) => void
}

const Row = ({
  ariaAttributes,
  index,
  style,
  stats,
  edits,
  onChange,
}: RowComponentProps<RowProps>) => {
  const stat = stats[index]
  if (!stat) return null

  return (
    // `px-6` on the row itself, not on `List` - the pane has no padding of its own (see
    // AchievementList.tsx's Row for the same approach), and padding on a row's own block is safe.
    <div {...ariaAttributes} style={style} className='mt-2 px-6'>
      <StatisticRow
        isEdited={stat.id in edits}
        stat={stat}
        value={edits[stat.id] ?? stat.value}
        onChange={value => onChange(stat, value)}
      />
    </div>
  )
}

interface StatisticsListProps {
  stats: StatDto[]
  edits: Record<string, number>
  // While FloatingActionBar is showing, extra bottom padding lets the last rows scroll clear of it.
  hasActionBar: boolean
  onChange: (stat: StatDto, value: number) => void
}

// Virtualized replacement for a plain `.map()` of `StatisticRow` - same rationale and `react-window`
// v2 `List` shape as AchievementList.tsx, including keeping horizontal padding on each row rather
// than on the List itself.
export const StatisticsList = ({ stats, edits, hasActionBar, onChange }: StatisticsListProps) => (
  <List
    className={hasActionBar ? 'pb-24' : 'pb-4'}
    rowComponent={Row}
    rowCount={stats.length}
    rowHeight={ROW_HEIGHT}
    rowProps={{ stats, edits, onChange }}
    style={{ height: '100%', width: '100%' }}
  />
)
