import { Button, cn } from '@heroui/react';
import Image from 'next/image';
import { memo, useMemo } from 'react';
import type { ReactElement } from 'react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCancel, TbLock, TbLockOpen } from 'react-icons/tb';
import { FixedSizeList as List } from 'react-window';

import AchievementButtons from '@/components/achievements/AchievementButtons';
import { useSearchContext } from '@/components/contexts/SearchContext';
import { useStateContext } from '@/components/contexts/StateContext';
import { useUserContext } from '@/components/contexts/UserContext';
import CustomTooltip from '@/components/ui/CustomTooltip';
import type { Achievement, UserSummary } from '@/types';
import { toggleAchievement } from '@/utils/achievements';
import { checkSteamStatus } from '@/utils/tasks';

interface RowData {
    userSummary: UserSummary;
    appId: number;
    appName: string;
    filteredAchievements: Achievement[];
    updateAchievement: (achievementId: string, newAchievedState: boolean) => void;
    t: (key: string) => string;
}

interface RowProps {
    index: number;
    style: CSSProperties;
    data: RowData;
}

const Row = memo(({ index, style, data }: RowProps): ReactElement | null => {
    const { userSummary, appId, appName, filteredAchievements, updateAchievement, t } = data;
    const item = filteredAchievements[index];

    if (!item) return null;

    const achieved = item.achieved || false;
    const protectedAchievement = item.protected_achievement || false;
    const percent = item.percent || 0;
    const hidden = item.hidden || false;

    const iconUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/';
    const icon = achieved ? `${iconUrl}${appId}/${item.iconNormal}` : `${iconUrl}${appId}/${item.iconLocked}`;

    const handleToggle = async (): Promise<void> => {
        // Make sure Steam client is running
        const isSteamRunning = await checkSteamStatus(true);
        if (!isSteamRunning) return;
        const success = await toggleAchievement(
            userSummary?.steamId,
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
        <div style={style} className='grid grid-cols-1 pb-4 px-4'>
            <div className='border border-border rounded-lg shadow-sm'>
                <div className='flex items-center p-3 bg-titlebar rounded-t-lg'>
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
                    <div className='flex flex-col flex-grow'>
                        <CustomTooltip placement='right' content={item.id}>
                            <p className='font-bold text-sm w-fit'>
                                {item.name}
                            </p>
                        </CustomTooltip>
                        <div className='w-fit'>
                            <p className={cn(
                                'text-sm text-altwhite',
                                hidden && 'blur-[3px] hover:blur-none transition-all duration-200'
                            )}>
                                {item.description || ''}
                            </p>
                        </div>
                    </div>
                    <Button
                        size='sm'
                        isDisabled={protectedAchievement}
                        className={cn(
                            'font-semibold rounded-lg text-button-text',
                            protectedAchievement ? 'bg-warning' : achieved ? 'bg-danger' : 'bg-dynamic'
                        )}
                        onPress={handleToggle}
                        startContent={
                            protectedAchievement ? <TbCancel size={20} /> :
                                achieved ? <TbLock size={20} /> : <TbLockOpen size={20} />
                        }
                    >
                        {protectedAchievement ? t('achievementManager.achievements.protected') :
                            achieved ? t('achievementManager.achievements.lock') : t('achievementManager.achievements.unlock')}
                    </Button>
                </div>
                <div className='p-1 bg-titlebar select-none rounded-b-lg'>
                    <div className='w-full bg-titlehover rounded-full h-3.5 relative'>
                        <div className='bg-dynamic/40 h-3.5 rounded-full flex items-center' style={{ width: `${percent}%`, position: 'relative' }} />
                        {percent !== undefined && (
                            <p className={cn(
                                'text-[11px] text-button-text  absolute',
                                'inset-0 flex items-center justify-center mix-blend-difference'
                            )}>
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

interface AchievementsListProps {
    achievements: Achievement[];
    setAchievements: Dispatch<SetStateAction<Achievement[]>>;
    protectedAchievements: boolean;
    windowInnerHeight: number;
}

export default function AchievementsList({
    achievements,
    setAchievements,
    protectedAchievements,
    windowInnerHeight
}: AchievementsListProps): ReactElement {
    const { t } = useTranslation();
    const { userSummary } = useUserContext();
    const { achievementQueryValue } = useSearchContext();
    const { appId, appName } = useStateContext();

    const updateAchievement = (achievementId: string, newAchievedState: boolean): void => {
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

    const itemData: RowData = {
        userSummary,
        appId: appId as number,
        appName: appName as string,
        filteredAchievements,
        updateAchievement,
        t
    };

    return (
        <div className='flex flex-col gap-2 w-full scroll-smooth'>
            {achievements.length > 0 ? (
                <>
                    <AchievementButtons
                        achievements={achievements}
                        setAchievements={setAchievements}
                        protectedAchievements={protectedAchievements}
                    />

                    <List
                        height={windowInnerHeight - 172}
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