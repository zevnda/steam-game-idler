import type { Achievement, ChangedStats, Statistic } from '@/types'
import type { ChangeEvent, CSSProperties, Dispatch, ReactElement, SetStateAction } from 'react'

import { cn, NumberInput } from '@heroui/react'
import { memo, useMemo, useState } from 'react'
import { useSearchStore } from '@/stores/searchStore'
import { useTranslation } from 'react-i18next'
import { FixedSizeList as List } from 'react-window'

import StatisticButtons from '@/components/achievements/StatisticButtons'

interface RowData {
  filteredStatistics: Statistic[]
  updateStatistic: (id: string, e: number | ChangeEvent<HTMLInputElement>) => void
  t: (key: string) => string
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement | null => {
  const { filteredStatistics, updateStatistic, t } = data
  const item1 = filteredStatistics[index * 2]
  const item2 = filteredStatistics[index * 2 + 1]

  if (!item1 && !item2) return null

  const protectedStatisticOne = item1?.protected_stat || false
  const protectedStatisticTwo = item2?.protected_stat || false

  return (
    <div style={style} className='grid grid-cols-2 gap-3 pr-6'>
      {item1 && (
        <div key={item1.id} className='flex flex-col gap-4'>
          <div className={cn('flex justify-between items-center max-h-12', 'bg-achievement-main p-2 rounded-lg')}>
            <div className='flex flex-col'>
              <p className='text-sm font-bold w-full truncate'>{item1.id}</p>
              <p className={`text-[10px] ${protectedStatisticOne ? 'text-warning' : 'text-altwhite'}`}>
                {t('achievementManager.statistics.flags')}: {item1.flags}
              </p>
            </div>
            <NumberInput
              hideStepper
              isDisabled={protectedStatisticOne}
              size='sm'
              value={item1.value}
              maxValue={99999}
              formatOptions={{ useGrouping: false }}
              onChange={e => updateStatistic(item1.id, e)}
              aria-label='statistic value'
              className='w-[120px]'
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
        <div key={item2.id} className='flex flex-col gap-4'>
          <div className={cn('flex justify-between items-center max-h-12', 'bg-achievement-main p-2 rounded-lg')}>
            <div className='flex flex-col'>
              <p className='text-sm font-bold w-full truncate'>{item2.id}</p>
              <p className={`text-[10px] ${protectedStatisticTwo ? 'text-warning' : 'text-altwhite'}`}>
                {t('achievementManager.statistics.flags')}: {item2.flags}
              </p>
            </div>
            <NumberInput
              hideStepper
              isDisabled={protectedStatisticTwo}
              size='sm'
              value={item2.value}
              maxValue={99999}
              formatOptions={{ useGrouping: false }}
              onChange={e => updateStatistic(item2.id, e)}
              aria-label='statistic value'
              className='w-[120px]'
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
  setStatistics: Dispatch<SetStateAction<Statistic[]>>
  setAchievements: Dispatch<SetStateAction<Achievement[]>>
  windowInnerHeight: number
  setRefreshKey?: Dispatch<SetStateAction<number>>
}

export default function StatisticsList({
  statistics,
  setStatistics,
  setAchievements,
  windowInnerHeight,
  setRefreshKey,
}: StatisticsListProps): ReactElement {
  const { t } = useTranslation()
  const { statisticQueryValue } = useSearchStore()
  const [changedStats, setChangedStats] = useState<ChangedStats>({})

  const updateStatistic = (id: string, e: number | ChangeEvent<HTMLInputElement>): void => {
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
    () => statistics.filter(statistic => statistic.id.toLowerCase().includes(statisticQueryValue.toLowerCase())),
    [statistics, statisticQueryValue],
  )

  const itemData: RowData = { filteredStatistics, updateStatistic, t }

  return (
    <div className='flex flex-col gap-2 w-full scroll-smooth'>
      {statistics.length > 0 ? (
        <>
          <StatisticButtons
            statistics={statistics}
            setStatistics={setStatistics}
            changedStats={changedStats}
            setChangedStats={setChangedStats}
            setAchievements={setAchievements}
            setRefreshKey={setRefreshKey}
          />

          <List
            height={windowInnerHeight - 196}
            itemCount={Math.ceil(filteredStatistics.length / 2)}
            itemSize={62}
            width='100%'
            itemData={itemData}
          >
            {Row}
          </List>
        </>
      ) : (
        <div className='flex flex-col gap-2 justify-center items-center my-2 bg-tab-panel rounded-lg p-4 mr-10'>
          <p>{t('achievementManager.statistics.empty')}</p>
        </div>
      )}
    </div>
  )
}
