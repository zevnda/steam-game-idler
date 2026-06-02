import type { Achievement, ChangedStats, Statistic } from '@/shared/types'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedSizeList as List } from 'react-window'
import { cn, NumberInput } from '@heroui/react'
import i18next from 'i18next'
import { StatisticButtons } from '@/features/achievement-manager/components/StatisticButtons'
import { useUiStore } from '@/shared/stores'

interface StatisticsListProps {
  statistics: Statistic[]
  setStatistics: React.Dispatch<React.SetStateAction<Statistic[]>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  windowInnerHeight: number
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>
}

interface RowData {
  filteredStatistics: Statistic[]
  updateStatistic: (id: string, val: number | React.ChangeEvent<HTMLInputElement>) => void
}

const Row = memo(
  ({ index, style, data }: { index: number; style: React.CSSProperties; data: RowData }) => {
    const { filteredStatistics, updateStatistic } = data
    const item1 = filteredStatistics[index * 2]
    const item2 = filteredStatistics[index * 2 + 1]
    if (!item1 && !item2) return null

    const StatCell = ({ item }: { item: Statistic }) => (
      <div
        className={cn(
          'flex justify-between items-center bg-card hover:bg-sidebar/60 duration-150 px-3 py-2.5 rounded-lg',
        )}
      >
        <div className='flex flex-col min-w-0 mr-3'>
          <p className='text-sm font-semibold truncate'>{item.id}</p>
          <p className={`text-xs ${item.protected_stat ? 'text-warning' : 'text-altwhite'}`}>
            {i18next.t('achievementManager.statistics.flags')}: {item.flags}
          </p>
        </div>
        <NumberInput
          hideStepper
          isDisabled={item.protected_stat}
          size='sm'
          value={item.value}
          formatOptions={{ useGrouping: false }}
          onChange={e => updateStatistic(item.id, e)}
          aria-label='statistic value'
          className='w-30 shrink-0'
          classNames={{
            inputWrapper: cn(
              'bg-stats-input data-[hover=true]:!bg-stats-inputhover group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent group-data-[focus-within=true]:!bg-stats-inputhover h-8',
            ),
            input: ['text-sm !text-content'],
          }}
        />
      </div>
    )

    return (
      <div style={style} className='grid grid-cols-2 gap-3 p-2'>
        {item1 && <StatCell item={item1} />}
        {item2 && <StatCell item={item2} />}
      </div>
    )
  },
)

export function StatisticsList({
  statistics,
  setStatistics,
  setAchievements,
  windowInnerHeight,
  setRefreshKey,
}: StatisticsListProps) {
  const { t } = useTranslation()
  const [changedStats, setChangedStats] = useState<ChangedStats>({})
  const statisticQuery = useUiStore(s => s.statisticQuery)

  const updateStatistic = (id: string, val: number | React.ChangeEvent<HTMLInputElement>) => {
    const newValue = typeof val === 'number' ? val : Number((val.target as HTMLInputElement).value)
    setChangedStats(prev => {
      const updated = { ...prev }
      if (!isNaN(newValue)) {
        updated[id] = newValue
      } else {
        delete updated[id]
      }
      return updated
    })
    setStatistics(prev => prev.map(s => (s.id === id ? { ...s, value: newValue || 0 } : s)))
  }

  const filtered = useMemo(
    () => statistics.filter(s => s.id.toLowerCase().includes(statisticQuery.toLowerCase())),
    [statistics, statisticQuery],
  )

  return (
    <div className='flex flex-col gap-2 w-full scroll-smooth'>
      <StatisticButtons
        statistics={statistics}
        setStatistics={setStatistics}
        changedStats={changedStats}
        setChangedStats={setChangedStats}
        setAchievements={setAchievements}
        setRefreshKey={setRefreshKey}
      />
      <div className='border border-border/40 rounded-xl overflow-hidden bg-base/50'>
        {statistics.length === 0 ? (
          <div className='flex justify-center items-center p-12'>
            <p className='text-center text-content'>{t('achievementManager.statistics.empty')}</p>
          </div>
        ) : (
          <List
            height={windowInnerHeight - 282}
            itemCount={Math.ceil(filtered.length / 2)}
            itemSize={62}
            width='100%'
            itemData={{ filteredStatistics: filtered, updateStatistic }}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  )
}
