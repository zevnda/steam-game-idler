import { Alert, Button } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SiSteam, SiSteamdb } from 'react-icons/si';
import { TbAlertHexagonFilled, TbArrowBack, TbFoldersFilled } from 'react-icons/tb';

import { useNavigationContext } from '@/components/contexts/NavigationContext';
import { useSearchContext } from '@/components/contexts/SearchContext';
import { useStateContext } from '@/components/contexts/StateContext';
import { useUserContext } from '@/components/contexts/UserContext';
import CustomTooltip from '@/components/ui/CustomTooltip';
import ExtLink from '@/components/ui/ExtLink';
import { logEvent } from '@/utils/tasks';
import { showDangerToast } from '@/utils/toasts';

interface PageHeaderProps {
    protectedAchievements: boolean;
    protectedStatistics: boolean;
}

export default function PageHeader({ protectedAchievements, protectedStatistics }: PageHeaderProps): ReactElement {
    const { t } = useTranslation();
    const { userSummary, setAchievementsUnavailable, setStatisticsUnavailable } = useUserContext();
    const { appId, appName, setShowAchievements } = useStateContext();
    const { setAchievementQueryValue, setStatisticQueryValue } = useSearchContext();
    const { setCurrentTab } = useNavigationContext();

    const handleClick = (): void => {
        setShowAchievements(false);
        setCurrentTab('achievements');
        setAchievementQueryValue('');
        setStatisticQueryValue('');
        setAchievementsUnavailable(true);
        setStatisticsUnavailable(true);
    };

    const handleOpenAchievementFile = async (): Promise<void> => {
        try {
            const filePath = `cache\\${userSummary?.steamId}\\achievement_data\\${appId}.json`;
            await invoke('open_file_explorer', { path: filePath });
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleOpenLogFile):', error);
            logEvent(`[Error] in (handleOpenLogFile): ${error}`);
        }
    };

    return (
        <div className='relative flex justify-between items-center'>
            {(protectedAchievements || protectedStatistics) && (
                <div className='absolute top-0 right-0'>
                    <Alert
                        hideIcon
                        title={
                            <p>
                                <Trans i18nKey='achievementManager.alert'>
                                    Some protected achievements or statistics have been disabled.
                                    <ExtLink className='text-link' href='https://partner.steamgames.com/doc/features/achievements#game_server_stats:~:text=Stats%20and%20achievements%20that%20are%20settable%20by%20game%20servers%20cannot%20be%20set%20by%20clients.'>
                                        <span> Learn more</span>
                                    </ExtLink>
                                </Trans>
                            </p>
                        }
                        startContent={<TbAlertHexagonFilled fontSize={22} className='text-content' />}
                        classNames={{
                            base: ['h-10 py-1 flex justify-center items-center gap-0 rounded-lg bg-dynamic/50 text-content border border-border'],
                            title: ['text-xs'],
                        }}
                    />
                </div>
            )}
            <div className='flex gap-3'>
                <Button
                    isIconOnly
                    size='sm'
                    className='rounded-full bg-border'
                    startContent={<TbArrowBack fontSize={18} className='text-content' />}
                    onPress={handleClick}
                />
                <div className='flex items-center gap-1 w-full'>
                    <p className='text-lg font-semibold m-0 p-0'>
                        {appName}
                    </p>
                    <CustomTooltip content={t('achievementManager.steam')} placement='top'>
                        <div>
                            <ExtLink href={`https://steamcommunity.com/stats/${appId}/achievements/`}>
                                <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                                    <SiSteam fontSize={14} />
                                </div>
                            </ExtLink>
                        </div>
                    </CustomTooltip>
                    <CustomTooltip content={t('achievementManager.steamDB')} placement='top'>
                        <div>
                            <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                                <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                                    <SiSteamdb fontSize={14} />
                                </div>
                            </ExtLink>
                        </div>
                    </CustomTooltip>
                    <CustomTooltip content={t('achievementManager.file')} placement='top'>
                        <div>
                            <div className='hover:bg-titlehover rounded-full p-1 cursor-pointer duration-200' onClick={handleOpenAchievementFile}>
                                <TbFoldersFilled fontSize={18} />
                            </div>
                        </div>
                    </CustomTooltip>
                </div>
            </div>
        </div>
    );
}