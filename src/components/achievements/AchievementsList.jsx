import { addToast, Button, Tooltip } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import Image from 'next/image';
import { useContext, memo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { toggleAchievement } from '@/utils/utils';

const Row = memo(({ index, style, data }) => {
    const { appId, appName, achievementList, userGameAchievementsMap, percentageMap } = data;
    const item = achievementList[index];

    if (!item) return null;

    const isUnlocked = userGameAchievementsMap.get(item.name) || false;
    const percentage = parseInt(percentageMap.get(item.name));

    const handleToggle = async () => {
        // Check if Steam is running
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            return addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }

        toggleAchievement(appId, item.name, appName, isUnlocked ? 'Locked' : 'Unlocked');
        userGameAchievementsMap.set(item.name, !isUnlocked);

        if (data.forceUpdate) {
            data.forceUpdate();
        }
    };

    return (
        <div style={style} className='grid grid-cols-1 p-2'>
            <div className='border border-border rounded-lg shadow-sm'>
                <div className='flex items-center p-3 bg-container dark:bg-[#1a1a1a] rounded-t-lg'>
                    <div className='w-10 h-10 flex items-center justify-center'>
                        <Image
                            className='rounded-full mr-3'
                            src={isUnlocked ? item.icon : item.icongray}
                            width={40}
                            height={40}
                            alt={`${item.name} image`}
                            priority
                        />
                    </div>
                    <div className='flex flex-col w-full'>
                        <Tooltip size='sm' closeDelay={0} placement='right' content={item.name} className='bg-titlehover text-content'>
                            <p className='font-bold text-sm w-fit'>
                                {item.displayName}
                            </p>
                        </Tooltip>
                        <div className='w-full'>
                            <p className='text-sm text-altwhite'>
                                {item.description || 'Hidden achievement'}
                            </p>
                        </div>
                    </div>
                    {isUnlocked ? (
                        <Button
                            size='sm'
                            color='danger'
                            className='font-semibold rounded-lg'
                            onPress={handleToggle}
                        >
                            Lock
                        </Button>
                    ) : (
                        <Button
                            size='sm'
                            className='font-semibold rounded-lg bg-dynamic text-button'
                            onPress={handleToggle}
                        >
                            Unlock
                        </Button>
                    )}
                </div>
                <div className='p-1 bg-container dark:bg-[#1a1a1a] select-none rounded-b-lg'>
                    <div className='w-full bg-titlehover rounded-full h-3.5 relative'>
                        <div className='bg-dynamic/40 h-3.5 rounded-full flex items-center' style={{ width: `${percentage}%`, position: 'relative' }} />
                        {percentage !== undefined && (
                            <p className='text-[11px] text-button dark:text-offwhite absolute inset-0 flex items-center justify-center mix-blend-difference'>
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
    const { appId, appName } = useContext(StateContext);
    const { achievementList, achievementsUnavailable } = useContext(UserContext);
    const [refreshKey, setRefreshKey] = useState(0);

    const forceUpdate = () => setRefreshKey(prevKey => prevKey + 1);

    const itemData = { appId, appName, achievementList, userGameAchievementsMap, percentageMap, forceUpdate };

    return (
        <div className='flex flex-col gap-2 w-full max-h-[calc(100vh-210px)] overflow-y-auto scroll-smooth'>
            {achievementsUnavailable ? (
                <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
                    <p className='text-sm'>
                        No achievements found
                    </p>
                </div>
            ) : (
                <List
                    key={refreshKey}
                    height={window.innerHeight - 210}
                    itemCount={achievementList.length}
                    itemSize={100}
                    width='100%'
                    itemData={itemData}
                    marginBottom='10px'
                >
                    {Row}
                </List>
            )}
        </div>
    );
}