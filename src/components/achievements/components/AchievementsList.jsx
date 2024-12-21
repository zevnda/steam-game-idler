import React, { useContext } from 'react';
import Image from 'next/image';
import { Button, Tooltip } from '@nextui-org/react';
import useAchievementsList from '../hooks/useAchievementsList';
import { AppContext } from '../../layouts/components/AppContext';

export default function AchievementsList({ userGameAchievementsMap, percentageMap }) {
    const { achievementList, achievementsUnavailable } = useContext(AppContext);
    const { handleToggle } = useAchievementsList();

    return (
        <React.Fragment>
            <div className='grid grid-cols-1 gap-4 w-full max-h-[calc(100vh-225px)] overflow-y-auto scroll-smooth p-2'>
                {achievementsUnavailable && (
                    <div className='flex flex-col gap-2 justify-center items-center w-full'>
                        <p className='text-sm'>
                            No achievements found
                        </p>
                    </div>
                )}
                {achievementList && achievementList.map((item) => {
                    const isUnlocked = userGameAchievementsMap.get(item.name) || false;
                    const percentage = percentageMap.get(item.name);

                    return (
                        <div key={item.name} className='flex flex-col bg-container border border-border rounded shadow-sm'>
                            <div className='flex items-center p-3 bg-container dark:bg-[#1a1a1a]'>
                                <Image
                                    className='rounded-full mr-3'
                                    src={isUnlocked ? item.icon : item.icongray}
                                    width={40}
                                    height={40}
                                    alt={`${item.name} image`}
                                />
                                <div className='flex flex-col w-full'>
                                    <Tooltip size='sm' closeDelay={0} placement='right' content={<p className='font-semibold'>{item.name}</p>}>
                                        <p className='font-bold text-sm w-fit'>
                                            {item.displayName}
                                        </p>
                                    </Tooltip>
                                    <div className='w-full'>
                                        <p className='text-sm text-gray-600 dark:text-gray-400'>{item.description || 'Hidden achievement'}</p>
                                    </div>
                                </div>
                                {isUnlocked ? (
                                    <Button
                                        size='sm'
                                        color='danger'
                                        className='font-semibold rounded'
                                        onPress={() => handleToggle(item.name, 'Locked')}
                                    >
                                        Lock
                                    </Button>
                                ) : (
                                    <Button
                                        size='sm'
                                        color='primary'
                                        className='font-semibold rounded'
                                        onPress={() => handleToggle(item.name, 'Unlocked')}
                                    >
                                        Unlock
                                    </Button>
                                )}
                            </div>
                            <div className='p-1 bg-container dark:bg-[#1a1a1a] select-none'>
                                <div className='w-full bg-titlehover rounded-full h-3.5 relative'>
                                    <div className='bg-sgi h-3.5 rounded-full flex items-center' style={{ width: `${percentage}%`, position: 'relative' }}></div>
                                    <p className='text-[11px] text-black dark:text-offwhite absolute inset-0 flex items-center justify-center'>
                                        {percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </React.Fragment>
    );
}