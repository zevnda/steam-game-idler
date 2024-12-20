import React from 'react';
import { Input } from '@nextui-org/react';
import useStatisticsList from '../hooks/useStatisticsList';
import { handleInputChange } from '../utils/statisticsListHandler';

export default function StatisticsList({ statisticsUnavailable, statisticsList, userGameStatsMap, setInitialStatValues, newStatValues, setNewStatValues }) {
    useStatisticsList(statisticsList, userGameStatsMap, setInitialStatValues, setNewStatValues);

    return (
        <React.Fragment>
            <div className='flex flex-col gap-2 w-full overflow-y-auto scroll-smooth p-2'>
                {statisticsUnavailable ? (
                    <div className='flex justify-center items-center w-full'>
                        <p className='text-xs'>
                            No statistics found
                        </p>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 gap-4 bg-container border border-border text-xs p-4 rounded max-h-[calc(100vh-286px)] overflow-y-auto'>
                        {statisticsList && statisticsList.map((item) => {
                            return (
                                <div key={item.name} className='flex justify-between items-center max-h-12 border border-border bg-[#f1f1f1] dark:bg-[#1a1a1a] p-2 rounded'>
                                    {item.name}
                                    <Input
                                        size='sm'
                                        value={newStatValues[item.name]}
                                        onChange={(e) => handleInputChange(item.name, e.target.value, setNewStatValues)}
                                        className='w-[120px]'
                                        classNames={{
                                            inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                            input: ['text-xs']
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </React.Fragment>
    );
}