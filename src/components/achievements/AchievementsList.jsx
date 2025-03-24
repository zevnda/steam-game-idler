import { Button, Tooltip } from '@heroui/react';
import Image from 'next/image';
import { useContext, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList as List } from 'react-window';

import AchievementButtons from '@/components/achievements/AchievementButtons';
import { SearchContext } from '@/components/contexts/SearchContext';
import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { toggleAchievement } from '@/utils/achievements';
import { checkSteamStatus } from '@/utils/tasks';

const Row = memo(({ index, style, data }) => {
    const { userSummary, appId, appName, filteredAchievements, updateAchievement, t } = data;
    const item = filteredAchievements[index];

    if (!item) return null;

    const achieved = item.achieved || false;
    const protectedAchievement = item.protected_achievement || false;
    const percent = item.percent || 0;
    const hidden = item.hidden || false;

    const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/';
    const icon = achieved ? `${iconUrl}${appId}/${item.iconNormal}` : `${iconUrl}${appId}/${item.iconLocked}`;

    const handleToggle = async () => {
        // Make sure Steam client is running
        const isSteamRunning = await checkSteamStatus(true);
        if (!isSteamRunning) return;
        const success = await toggleAchievement(
            userSummary.steamId,
            appId,
            item.id,
            appName,
            achieved ? 'Locked' : 'Unlocked'
        );
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
                                {item.description || ''}
                            </p>
                        </div>
                    </div>
                    <Button
                        size='sm'
                        isDisabled={protectedAchievement}
                        className={`font-semibold rounded-lg text-button ${protectedAchievement ? 'bg-warning' : achieved ? 'bg-danger' : 'bg-dynamic'}`}
                        onPress={handleToggle}
                    >
                        {protectedAchievement ? t('achievementManager.achievements.protected') :
                            achieved ? t('achievementManager.achievements.lock') : t('achievementManager.achievements.unlock')}
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

export default function AchievementsList({ achievements, setAchievements, protectedAchievements }) {
    const { t } = useTranslation();
    const { userSummary } = useContext(UserContext);
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

    const itemData = { userSummary, appId, appName, filteredAchievements, updateAchievement, t };

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
                        {t('achievementManager.achievements.empty')}
                    </p>
                </div>
            )}
        </div>
    );
}