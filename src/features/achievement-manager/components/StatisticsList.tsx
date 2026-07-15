import type { RowComponentProps } from 'react-window'
import type { StatDto } from '../types'
import { List } from 'react-window'
import { StatisticRow } from './StatisticRow'

// StatisticRow's intrinsic height - matches AchievementsList.tsx's ROW_HEIGHT exactly so both tabs
// keep the same row rhythm; see that file's comment for why this is a tuned constant rather than
// measured.
const ROW_HEIGHT = 76

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
    <div {...ariaAttributes} style={style} className='mt-2'>
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
  onChange: (stat: StatDto, value: number) => void
}

// Virtualized replacement for a plain `.map()` of `StatisticRow` - see AchievementsList.tsx's
// top-of-file comment (same rationale, same `react-window` v2 `List` shape, same "no horizontal
// padding here" constraint).
export const StatisticsList = ({ stats, edits, onChange }: StatisticsListProps) => (
  <List
    rowComponent={Row}
    rowCount={stats.length}
    rowHeight={ROW_HEIGHT}
    rowProps={{ stats, edits, onChange }}
    style={{ height: '100%', width: '100%' }}
  />
)
