import { NumberInput } from '@heroui/react';
import { memo, useContext, useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

import StatisticButtons from '@/components/achievements/StatisticButtons';
import { SearchContext } from '@/components/contexts/SearchContext';

const Row = memo(({ index, style, data }) => {
    const { filteredStatistics, updateStatistic } = data;
    const item1 = filteredStatistics[index * 2];
    const item2 = filteredStatistics[index * 2 + 1];

    if (!item1 && !item2) return null;

    const protectedStatisticOne = item1?.protected_stat || false;
    const protectedStatisticTwo = item2?.protected_stat || false;

    return (
        <div style={style} className='grid grid-cols-2 gap-2 p-2'>
            {item1 && (
                <div key={item1.id} className='flex flex-col gap-4'>
                    <div className='flex justify-between items-center max-h-12 border border-border bg-container dark:bg-[#1a1a1a] p-2 rounded-lg'>
                        <div className='flex flex-col'>
                            <p className='text-sm w-full truncate'>
                                {item1.id}
                            </p>
                            <p className={`text-[10px] ${protectedStatisticOne ? 'text-warning' : 'text-altwhite'}`}>
                                Flags: {item1.flags}
                            </p>
                        </div>
                        <NumberInput
                            hideStepper
                            isDisabled={protectedStatisticOne}
                            size='sm'
                            value={item1.value}
                            maxValue={99999}
                            formatOptions={{ useGrouping: false }}
                            onChange={(e) => updateStatistic(item1.id, parseInt(e.target.value))}
                            aria-label='statistic value'
                            className='w-[120px]'
                            classNames={{
                                inputWrapper: ['bg-titlebar border border-border hover:!bg-input rounded-lg group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent group-data-[focus-within=true]:!bg-titlebar h-8'],
                                input: ['text-sm !text-content']
                            }}
                        />
                    </div>
                </div>
            )}
            {item2 && (
                <div key={item2.id} className='flex flex-col gap-4'>
                    <div className='flex justify-between items-center max-h-12 border border-border bg-container dark:bg-[#1a1a1a] p-2 rounded-lg'>
                        <div className='flex flex-col'>
                            <p className='text-sm w-full truncate'>
                                {item2.id}
                            </p>
                            <p className={`text-[10px] ${protectedStatisticTwo ? 'text-warning' : 'text-altwhite'}`}>
                                Flags: {item2.flags}
                            </p>
                        </div>
                        <NumberInput
                            hideStepper
                            isDisabled={protectedStatisticTwo}
                            size='sm'
                            value={item2.value}
                            maxValue={99999}
                            formatOptions={{ useGrouping: false }}
                            onChange={(e) => updateStatistic(item2.id, parseInt(e.target.value))}
                            aria-label='statistic value'
                            className='w-[120px]'
                            classNames={{
                                inputWrapper: ['bg-titlebar border border-border hover:!bg-input rounded-lg group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent group-data-[focus-within=true]:!bg-titlebar h-8'],
                                input: ['text-sm !text-content']
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

Row.displayName = 'Row';

export default function StatisticsList({ statistics, setStatistics, steamNotRunning }) {
    const { statisticQueryValue } = useContext(SearchContext);
    const [changedStats, setChangedStats] = useState({});

    const updateStatistic = (id, newValue) => {
        setStatistics(prevStatistics => {
            const stat = prevStatistics.find(s => s.id === id);
            const originalValue = stat ? stat.value : 0;

            if (originalValue !== newValue) {
                setChangedStats(prev => ({
                    ...prev,
                    [id]: newValue || 0
                }));
            } else {
                setChangedStats(prev => {
                    const updated = { ...prev };
                    delete updated[id];
                    return updated;
                });
            }

            return prevStatistics.map(stat =>
                stat.id === id ? { ...stat, value: newValue || 0 } : stat
            );
        });
    };

    const filteredStatistics = useMemo(() =>
        statistics.filter(statistic =>
            statistic.id.toLowerCase().includes(statisticQueryValue.toLowerCase())
        ),
        [statistics, statisticQueryValue]
    );

    const itemData = { filteredStatistics, updateStatistic };

    if (steamNotRunning) return (
        <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
            <p className='text-sm'>
                The Steam client must be running in order to view game statistics
            </p>
        </div>
    );

    return (
        <div className='flex flex-col gap-2 w-full max-h-[calc(100vh-195px)] overflow-y-auto scroll-smooth'>
            {statistics.length > 0 ? (
                <>
                    <StatisticButtons
                        statistics={statistics}
                        setStatistics={setStatistics}
                        changedStats={changedStats}
                        setChangedStats={setChangedStats}
                    />

                    <List
                        height={window.innerHeight - 195}
                        itemCount={Math.ceil(filteredStatistics.length / 2)}
                        itemSize={58}
                        width='100%'
                        itemData={itemData}
                    >
                        {Row}
                    </List>
                </>
            ) : (
                <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
                    <p className='text-sm'>
                        No statistics found
                    </p>
                </div>
            )}
        </div>
    );
}