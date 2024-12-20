import React from 'react';
import Image from 'next/image';
import { Button, Tooltip } from '@nextui-org/react';
import useAchievementsList from '../hooks/useAchievementsList';

export default function AchievementsList({ appId, appName, achievementsUnavailable, achievementList, userGameAchievementsMap, percentageMap }) {
    const { handleToggle } = useAchievementsList(appId, appName);

    return (
        <React.Fragment>
            <div className='grid grid-cols-1 gap-4 w-full pr-2 max-h-[calc(100vh-272px)] overflow-y-auto scroll-smooth p-2'>
                {achievementsUnavailable && (
                    <div className='flex flex-col gap-2 justify-center items-center w-full'>
                        <p className='text-xs'>
                            No achievements found
                        </p>
                    </div>
                )}
                {achievementList && achievementList.map((item) => {
                    const isUnlocked = userGameAchievementsMap.get(item.name) || false;
                    const percentage = percentageMap.get(item.name);

                    return (
                        <div key={item.name} className='flex flex-col bg-container border border-border rounded shadow-sm'>
                            <div className='flex items-center p-3 bg-base'>
                                <Image
                                    className='rounded-full mr-3'
                                    src={isUnlocked ? item.icon : item.icongray}
                                    width={40}
                                    height={40}
                                    alt={`${item.name} image`}
                                />
                                <div className='flex flex-col w-full'>
                                    <Tooltip size='sm' closeDelay={0} content={<p className='font-semibold'>{item.name}</p>}>
                                        <p className='font-bold text-xs w-fit'>
                                            {item.displayName}
                                        </p>
                                    </Tooltip>
                                    <div className='w-full'>
                                        <p className='text-xs text-gray-600 dark:text-gray-400'>{item.description || 'Hidden achievement'}</p>
                                    </div>
                                </div>
                                {isUnlocked ? (
                                    <Button
                                        size='sm'
                                        color='danger'
                                        className='font-semibold rounded'
                                        onClick={() => handleToggle(item.name, 'Locked')}
                                    >
                                        Lock
                                    </Button>
                                ) : (
                                    <Button
                                        size='sm'
                                        color='primary'
                                        className='font-semibold rounded'
                                        onClick={() => handleToggle(item.name, 'Unlocked')}
                                    >
                                        Unlock
                                    </Button>
                                )}
                            </div>
                            <div className='p-1'>
                                <div className='w-full bg-titlehover rounded-full h-2.5 mb-1'>
                                    <div className='bg-sgi h-2.5 rounded-full' style={{ width: `${percentage}%` }}></div>
                                </div>
                                <p className='text-xs text-right'>{percentage.toFixed(1)}% unlock rate</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </React.Fragment>
    );
}