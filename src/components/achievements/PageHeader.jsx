import { addToast, Alert, Button, Tooltip } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';
import { SiSteam, SiSteamdb } from 'react-icons/si';
import { TbAlertHexagonFilled, TbArrowBack, TbFoldersFilled } from 'react-icons/tb';

import { NavigationContext } from '@/components/contexts/NavigationContext';
import { SearchContext } from '@/components/contexts/SearchContext';
import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import ExtLink from '@/components/ui/ExtLink';
import { logEvent } from '@/utils/utils';

export default function PageHeader({ protectedAchievements, protectedStatistics }) {
    const { userSummary, setAchievementsUnavailable, setStatisticsUnavailable } = useContext(UserContext);
    const { appId, appName } = useContext(StateContext);
    const { setAchievementQueryValue } = useContext(SearchContext);
    const { setShowAchievements } = useContext(StateContext);
    const { setCurrentTab } = useContext(NavigationContext);

    const handleClick = () => {
        setShowAchievements(false);
        setCurrentTab('achievements');
        setAchievementQueryValue('');
        setAchievementsUnavailable(true);
        setStatisticsUnavailable(true);
    };

    const handleOpenAchievementFile = async () => {
        try {
            const filePath = `cache\\${userSummary.steamId}\\achievement_data\\${appId}.json`;
            await invoke('open_file_explorer', { path: filePath });
        } catch (error) {
            addToast({ description: `Error in (handleOpenLogFile): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleOpenLogFile):', error);
            logEvent(`[Error] in (handleOpenLogFile): ${error}`);
        }
    };

    return (
        <div className='relative flex justify-between items-center mb-4'>
            {(protectedAchievements || protectedStatistics) && (
                <div className='absolute top-0 right-0'>
                    <Alert
                        hideIcon
                        title={
                            <p>
                                Some protected achievements or statistics have been disabled.
                                <ExtLink className='text-link' href='https://partner.steamgames.com/doc/features/achievements#game_server_stats:~:text=Stats%20and%20achievements%20that%20are%20settable%20by%20game%20servers%20cannot%20be%20set%20by%20clients.'>
                                    <span> Learn more</span>
                                </ExtLink>
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
                    <Tooltip content='View on Steam' placement='top' closeDelay={0} size='sm' className='bg-titlehover text-content'>
                        <div>
                            <ExtLink href={`https://steamcommunity.com/stats/${appId}/achievements/`}>
                                <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                                    <SiSteam fontSize={14} />
                                </div>
                            </ExtLink>
                        </div>
                    </Tooltip>
                    <Tooltip content='View on SteamDB' placement='top' closeDelay={0} size='sm' className='bg-titlehover text-content'>
                        <div>
                            <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                                <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                                    <SiSteamdb fontSize={14} />
                                </div>
                            </ExtLink>
                        </div>
                    </Tooltip>
                    <Tooltip content='Open In File Explorer' placement='top' closeDelay={0} size='sm' className='bg-titlehover text-content'>
                        <div>
                            <div className='hover:bg-titlehover rounded-full p-1 cursor-pointer duration-200' onClick={handleOpenAchievementFile}>
                                <TbFoldersFilled fontSize={18} />
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}