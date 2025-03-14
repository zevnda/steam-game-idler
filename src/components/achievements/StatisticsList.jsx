import { NumberInput } from '@heroui/react';
import { useContext, memo } from 'react';
import { FixedSizeList as List } from 'react-window';

import { UserContext } from '@/components/contexts/UserContext';
import useStatisticsList from '@/hooks/achievements/useStatisticsList';

const Row = memo(({ index, style, data }) => {
    const { statisticsList, newStatValues, setNewStatValues } = data;
    const item1 = statisticsList[index * 2];
    const item2 = statisticsList[index * 2 + 1];

    const handleInputChange = (name, value, setNewStatValues) => {
        setNewStatValues(prevValues => ({
            ...prevValues,
            [name]: value
        }));
    };

    return (
        <div style={style} className='grid grid-cols-2 gap-2 p-2'>
            {item1 && (
                <div key={item1.name} className='flex flex-col gap-4'>
                    <div className='flex justify-between items-center max-h-12 border border-border bg-container dark:bg-[#1a1a1a] p-2 rounded-lg'>
                        <p className='text-sm w-full truncate'>
                            {item1.name}
                        </p>
                        <NumberInput
                            hideStepper
                            size='sm'
                            value={newStatValues[item1.name]}
                            maxValue={99999}
                            formatOptions={{ useGrouping: false }}
                            onChange={(e) => handleInputChange(item1.name, e.target.value, setNewStatValues)}
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
                <div key={item2.name} className='flex flex-col gap-4'>
                    <div className='flex justify-between items-center max-h-12 border border-border bg-container dark:bg-[#1a1a1a] p-2 rounded-lg'>
                        <p className='text-sm w-full truncate'>
                            {item2.name}
                        </p>
                        <NumberInput
                            hideStepper
                            size='sm'
                            value={newStatValues[item2.name]}
                            maxValue={99999}
                            formatOptions={{ useGrouping: false }}
                            onChange={(e) => handleInputChange(item2.name, e.target.value, setNewStatValues)}
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

export default function StatisticsList({ setInitialStatValues, newStatValues, setNewStatValues }) {
    const { statisticsList, statisticsUnavailable } = useContext(UserContext);
    useStatisticsList(statisticsList, setInitialStatValues, setNewStatValues);

    const itemData = { statisticsList, newStatValues, setNewStatValues };

    return (
        <div className='flex flex-col gap-2 w-full max-h-[calc(100vh-210px)] overflow-y-auto scroll-smooth'>
            {statisticsUnavailable ? (
                <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
                    <p className='text-sm'>
                        No statistics found
                    </p>
                </div>
            ) : (
                <List
                    height={window.innerHeight - 210}
                    itemCount={Math.ceil(statisticsList.length / 2)}
                    itemSize={58}
                    width='100%'
                    itemData={itemData}
                >
                    {Row}
                </List>
            )}
        </div>
    );
}