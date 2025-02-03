import { Fragment, useContext, memo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import Image from 'next/image';

import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { Button, Tooltip } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import { toggleAchievement } from '@/src/utils/utils';
import ErrorToast from '@/src/components/ui/ErrorToast';

const Row = memo(({ index, style, data }) => {
    const { appId, appName, achievementList, userGameAchievementsMap, percentageMap } = data;
    const item = achievementList[index];

    const isUnlockedInitial = item ? userGameAchievementsMap.get(item.name) || false : false;
    const [isUnlocked, setIsUnlocked] = useState(isUnlockedInitial);
    const percentage = item ? percentageMap.get(item.name) : undefined;

    if (!item) return null;

    const handleToggle = async () => {
        // Check if Steam is running
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            return toast.error(
                <ErrorToast
                    message={'Steam is not running'}
                    href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                />
            );
        }

        toggleAchievement(appId, item.name, appName, isUnlocked ? 'Locked' : 'Unlocked');
        userGameAchievementsMap.set(item.name, !isUnlocked);
        setIsUnlocked(!isUnlocked);
    };

    return (
        <div style={style} className='grid grid-cols-1 p-2'>
            <div className='border border-border rounded shadow-sm'>
                <div className='flex items-center p-3 bg-container dark:bg-[#1a1a1a]'>
                    <Image
                        className='rounded-full mr-3'
                        src={isUnlocked ? item.icon : item.icongray}
                        width={40}
                        height={40}
                        alt={`${item.name} image`}
                        priority
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
                            onPress={handleToggle}
                        >
                            Lock
                        </Button>
                    ) : (
                        <Button
                            size='sm'
                            color='primary'
                            className='font-semibold rounded'
                            onPress={handleToggle}
                        >
                            Unlock
                        </Button>
                    )}
                </div>
                <div className='p-1 bg-container dark:bg-[#1a1a1a] select-none'>
                    <div className='w-full bg-titlehover rounded-full h-3.5 relative'>
                        <div className='bg-sgi h-3.5 rounded-full flex items-center' style={{ width: `${percentage}%`, position: 'relative' }}></div>
                        {percentage !== undefined && (
                            <p className='text-[11px] text-black dark:text-offwhite absolute inset-0 flex items-center justify-center'>
                                {percentage.toFixed(1)}%
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

Row.displayName = 'Row';

export default function AchievementsList({ userGameAchievementsMap, percentageMap }) {
    const { appId, appName, achievementList, achievementsUnavailable } = useContext(AppContext);

    const itemData = { appId, appName, achievementList, userGameAchievementsMap, percentageMap };

    return (
        <Fragment>
            <div className='flex flex-col gap-2 w-full max-h-[calc(100vh-225px)] overflow-y-auto scroll-smooth'>
                {achievementsUnavailable ? (
                    <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
                        <p className='text-sm'>
                            No achievements found
                        </p>
                    </div>
                ) : (
                    <List
                        height={window.innerHeight - 225}
                        itemCount={achievementList.length}
                        itemSize={100}
                        width={'100%'}
                        itemData={itemData}
                        marginBottom={'10px'}
                    >
                        {Row}
                    </List>
                )}
            </div>
        </Fragment>
    );
}