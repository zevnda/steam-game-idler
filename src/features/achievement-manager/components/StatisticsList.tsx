import type { Achievement, ChangedStats, Statistic } from '@/shared/types'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedSizeList as List } from 'react-window'
import { cn, NumberInput } from '@heroui/react'
import i18next from 'i18next'
import { StatisticButtons } from '@/features/achievement-manager'
import { useSearchStore } from '@/shared/stores'

interface RowData {
  filteredStatistics: Statistic[]
  updateStatistic: (id: string, e: number | React.ChangeEvent<HTMLInputElement>) => void
}

interface RowProps {
  index: number
  style: React.CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps) => {
  const { filteredStatistics, updateStatistic } = data
  const item1 = filteredStatistics[index * 2]
  const item2 = filteredStatistics[index * 2 + 1]

  if (!item1 && !item2) return null

  const protectedStatisticOne = item1?.protected_stat || false
  const protectedStatisticTwo = item2?.protected_stat || false

  return (
    <div style={style} className='grid grid-cols-2 gap-3 p-2'>
      {item1 && (
        <div key={item1.id}>
          <div
            className={cn(
              'flex justify-between items-center',
              'bg-card hover:bg-sidebar/60 duration-150 px-3 py-2.5 rounded-lg',
            )}
          >
            <div className='flex flex-col min-w-0 mr-3'>
              <p className='text-sm font-semibold truncate'>{item1.id}</p>
              <p className={`text-xs ${protectedStatisticOne ? 'text-warning' : 'text-altwhite'}`}>
                {i18next.t('achievementManager.statistics.flags')}: {item1.flags}
              </p>
            </div>
            <NumberInput
              hideStepper
              isDisabled={protectedStatisticOne}
              size='sm'
              value={item1.value}
              formatOptions={{ useGrouping: false }}
              onChange={e => updateStatistic(item1.id, e)}
              aria-label='statistic value'
              className='w-30 shrink-0'
              classNames={{
                inputWrapper: cn(
                  'bg-stats-input data-[hover=true]:!bg-stats-inputhover',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                  'group-data-[focus-within=true]:!bg-stats-inputhover h-8',
                ),
                input: ['text-sm !text-content'],
              }}
            />
          </div>
        </div>
      )}
      {item2 && (
        <div key={item2.id}>
          <div
            className={cn(
              'flex justify-between items-center',
              'bg-card hover:bg-sidebar/60 duration-150 px-3 py-2.5 rounded-lg',
            )}
          >
            <div className='flex flex-col min-w-0 mr-3'>
              <p className='text-sm font-semibold truncate'>{item2.id}</p>
              <p className={`text-xs ${protectedStatisticTwo ? 'text-warning' : 'text-altwhite'}`}>
                {i18next.t('achievementManager.statistics.flags')}: {item2.flags}
              </p>
            </div>
            <NumberInput
              hideStepper
              isDisabled={protectedStatisticTwo}
              size='sm'
              value={item2.value}
              formatOptions={{ useGrouping: false }}
              onChange={e => updateStatistic(item2.id, e)}
              aria-label='statistic value'
              className='w-30 shrink-0'
              classNames={{
                inputWrapper: cn(
                  'bg-stats-input data-[hover=true]:!bg-stats-inputhover',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                  'group-data-[focus-within=true]:!bg-stats-inputhover h-8',
                ),
                input: ['text-sm !text-content'],
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
})

Row.displayName = 'Row'

interface StatisticsListProps {
  statistics: Statistic[]
  setStatistics: React.Dispatch<React.SetStateAction<Statistic[]>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  windowInnerHeight: number
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>
}

export const StatisticsList = ({
  statistics,
  setStatistics,
  setAchievements,
  windowInnerHeight,
  setRefreshKey,
}: StatisticsListProps) => {
  const { t } = useTranslation()
  const statisticQueryValue = useSearchStore(state => state.statisticQueryValue)
  const [changedStats, setChangedStats] = useState<ChangedStats>({})

  const updateStatistic = (id: string, e: number | React.ChangeEvent<HTMLInputElement>) => {
    setStatistics(prevStatistics => {
      const stat = prevStatistics.find(s => s.id === id)
      const originalValue = stat ? stat.value : 0

      const newValue = typeof e === 'number' ? e : Number(e.target.value)

      if (originalValue !== newValue) {
        setChangedStats(prev => ({
          ...prev,
          [id]: newValue || 0,
        }))
      } else {
        setChangedStats(prev => {
          const updated = { ...prev }
          delete updated[id]
          return updated
        })
      }

      return prevStatistics.map(stat => (stat.id === id ? { ...stat, value: newValue || 0 } : stat))
    })
  }

  const filteredStatistics = useMemo(
    () =>
      statistics.filter(statistic =>
        statistic.id.toLowerCase().includes(statisticQueryValue.toLowerCase()),
      ),
    [statistics, statisticQueryValue],
  )

  const itemData: RowData = { filteredStatistics, updateStatistic }

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
          <>
            {/* Sticky column header */}
            <div className='grid grid-cols-[28px_40px_1fr_auto] items-center gap-3 px-3 py-2 border-b border-border/40 sticky top-0 bg-sidebar z-10'>
              <span className='text-sm font-semibold text-content'>
                {t('achievementManager.statistics.title')}
              </span>
            </div>

            {/* List */}
            <List
              height={windowInnerHeight - 270}
              itemCount={Math.ceil(filteredStatistics.length / 2)}
              itemSize={62}
              width='100%'
              itemData={itemData}
            >
              {Row}
            </List>
          </>
        )}
      </div>
    </div>
  )
}
