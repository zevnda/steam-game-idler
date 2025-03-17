import { addToast, Button, Tooltip } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import Image from 'next/image';
import { useContext, memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

import AchievementButtons from '@/components/achievements/AchievementButtons';
import { SearchContext } from '@/components/contexts/SearchContext';
import { StateContext } from '@/components/contexts/StateContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { toggleAchievement } from '@/utils/utils';

const Row = memo(({ index, style, data }) => {
    const { appId, appName, filteredAchievements, updateAchievement } = data;
    const item = filteredAchievements[index];

    if (!item) return null;

    const achieved = item.achieved || false;
    const protectedAchievement = item.protected_achievement || false;
    const percent = item.percent || 0;
    const hidden = item.hidden || false;

    const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/';
    const icon = achieved ? `${iconUrl}${appId}/${item.iconNormal}` : `${iconUrl}${appId}/${item.iconLocked}`;

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
        const success = await toggleAchievement(appId, item.id, appName, achieved ? 'Locked' : 'Unlocked');
        if (success) {
            updateAchievement(item.id, !achieved);
        }
    };

    return (
        <div style={style} className='grid grid-cols-1 p-2'>
            <div className='border border-border rounded-lg shadow-sm'>
                <div className='flex items-center p-3 bg-container dark:bg-[#1a1a1a] rounded-t-lg'>
                    <div className='w-10 h-10 flex items-center justify-center'>
                        <Image
                            className='rounded-full mr-3'
                            src={icon}
                            width={40}
                            height={40}
                            alt={`${item.name} image`}
                            priority
                        />
                    </div>
                    <div className='flex flex-col w-full'>
                        <Tooltip size='sm' closeDelay={0} placement='right' content={item.id} className='bg-titlehover text-content'>
                            <p className='font-bold text-sm w-fit'>
                                {item.name}
                            </p>
                        </Tooltip>
                        <div className='w-fit'>
                            <p className={`text-sm text-altwhite ${hidden && 'blur-[3px] hover:blur-none transition-all duration-200'}`}>
                                {item.description || 'Hidden achievement'}
                            </p>
                        </div>
                    </div>
                    <Button
                        size='sm'
                        isDisabled={protectedAchievement}
                        className={`font-semibold rounded-lg text-button ${protectedAchievement ? 'bg-warning' : achieved ? 'bg-danger' : 'bg-dynamic'}`}
                        onPress={handleToggle}
                    >
                        {protectedAchievement ? 'Protected' : achieved ? 'Lock' : 'Unlock'}
                    </Button>
                </div>
                <div className='p-1 bg-container dark:bg-[#1a1a1a] select-none rounded-b-lg'>
                    <div className='w-full bg-titlehover rounded-full h-3.5 relative'>
                        <div className='bg-dynamic/40 h-3.5 rounded-full flex items-center' style={{ width: `${percent}%`, position: 'relative' }} />
                        {percent !== undefined && (
                            <p className='text-[11px] text-button dark:text-offwhite absolute inset-0 flex items-center justify-center mix-blend-difference'>
                                {percent.toFixed(1)}%
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

Row.displayName = 'Row';

export default function AchievementsList({ achievements, setAchievements, steamNotRunning, protectedAchievements }) {
    const { achievementQueryValue } = useContext(SearchContext);
    const { appId, appName } = useContext(StateContext);

    const updateAchievement = (achievementId, newAchievedState) => {
        setAchievements(prevAchievements => {
            return prevAchievements.map(achievement =>
                achievement.id === achievementId
                    ? { ...achievement, achieved: newAchievedState }
                    : achievement
            );
        });
    };

    const filteredAchievements = useMemo(() =>
        achievements.filter(achievement =>
            achievement.name.toLowerCase().includes(achievementQueryValue.toLowerCase())
        ),
        [achievements, achievementQueryValue]
    );

    const itemData = { appId, appName, filteredAchievements, updateAchievement };

    if (steamNotRunning) return (
        <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
            <p className='text-sm'>
                The Steam client must be running in order to view game achievements
            </p>
        </div>
    );

    return (
        <div className='flex flex-col gap-2 w-full max-h-[calc(100vh-195px)] overflow-y-auto scroll-smooth'>
            {achievements.length > 0 ? (
                <>
                    <AchievementButtons
                        achievements={achievements}
                        setAchievements={setAchievements}
                        protectedAchievements={protectedAchievements}
                    />

                    <List
                        height={window.innerHeight - 195}
                        itemCount={filteredAchievements.length}
                        itemSize={100}
                        width='100%'
                        itemData={itemData}
                    >
                        {Row}
                    </List>
                </>
            ) : (
                <div className='flex flex-col gap-2 justify-center items-center my-2 w-full'>
                    <p className='text-sm'>
                        No achievements found
                    </p>
                </div>
            )}
        </div>
    );
}