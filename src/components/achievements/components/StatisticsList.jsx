import React, { useContext } from 'react';
import useStatisticsList from '../hooks/useStatisticsList';
import { Input } from '@nextui-org/react';
import { handleInputChange } from '../utils/statisticsListHandler';
import { FixedSizeList as List } from 'react-window';
import { AppContext } from '../../layout/components/AppContext';

const Row = React.memo(({ index, style, data }) => {
    const { statisticsList, newStatValues, setNewStatValues } = data;
    const item1 = statisticsList[index * 2];
    const item2 = statisticsList[index * 2 + 1];

    return (
        <div style={style} className='grid grid-cols-2 gap-2 p-2'>
            {item1 && (
                <div key={item1.name} className='flex flex-col gap-4'>
                    <div className='flex justify-between items-center max-h-12 border border-border bg-container dark:bg-[#1a1a1a] p-2 rounded'>
                        <p className='text-sm'>
                            {item1.name}
                        </p>
                        <Input
                            size='sm'
                            value={newStatValues[item1.name] || '0'}
                            onChange={(e) => handleInputChange(item1.name, e.target.value, setNewStatValues)}
                            className='w-[120px]'
                            classNames={{
                                inputWrapper: ['bg-titlebar border border-inputborder hover:!bg-input rounded group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent group-data-[focus-within=true]:!bg-titlebar'],
                                input: ['text-sm']
                            }}
                        />
                    </div>
                </div>
            )}
            {item2 && (
                <div key={item2.name} className='flex flex-col gap-4'>
                    <div className='flex justify-between items-center max-h-12 border border-border bg-container dark:bg-[#1a1a1a] p-2 rounded'>
                        <p className='text-sm'>
                            {item2.name}
                        </p>
                        <Input
                            size='sm'
                            value={newStatValues[item2.name] || '0'}
                            onChange={(e) => handleInputChange(item2.name, e.target.value, setNewStatValues)}
                            className='w-[120px]'
                            classNames={{
                                inputWrapper: ['bg-titlebar border border-inputborder hover:!bg-input rounded group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent group-data-[focus-within=true]:!bg-titlebar'],
                                input: ['text-sm']
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
    const { statisticsList, statisticsUnavailable } = useContext(AppContext);
    useStatisticsList(statisticsList, setInitialStatValues, setNewStatValues);

    const itemData = { statisticsList, newStatValues, setNewStatValues };

    return (
        <React.Fragment>
            <div className='flex flex-col gap-2 w-full max-h-[calc(100vh-225px)] overflow-y-auto scroll-smooth'>
                {statisticsUnavailable ? (
                    <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
                        <p className='text-sm'>
                            No statistics found
                        </p>
                    </div>
                ) : (
                    <List
                        height={window.innerHeight - 225}
                        itemCount={Math.ceil(statisticsList.length / 2)}
                        itemSize={58}
                        width={'100%'}
                        itemData={itemData}
                    >
                        {Row}
                    </List>
                )}
            </div>
        </React.Fragment>
    );
}