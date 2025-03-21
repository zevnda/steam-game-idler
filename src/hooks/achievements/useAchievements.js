import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext, useEffect } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { logEvent } from '@/utils/global/tasks';

export default function useAchievements(setIsLoading,
    setAchievements,
    setStatistics,
    setProtectedAchievements,
    setProtectedStatistics,
) {
    const { appId } = useContext(StateContext);
    const { userSummary, setAchievementsUnavailable, setStatisticsUnavailable } = useContext(UserContext);

    useEffect(() => {
        const getAchievementData = async () => {
            try {
                // Check if Steam is running
                const steamRunning = await invoke('is_steam_running');
                if (!steamRunning) {
                    setIsLoading(false);
                    addToast({
                        description: <ErrorToast
                            message='Steam is not running'
                            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                        />,
                        color: 'danger'
                    });
                }

                const response = await invoke('get_achievement_data', { steamId: userSummary.steamId, appId });

                if (!response?.achievement_data && response.includes('Failed to initialize Steam API')) {
                    setIsLoading(false);
                    setAchievementsUnavailable(true);
                    setStatisticsUnavailable(true);
                    addToast({
                        description: <ErrorToast
                            message='Account mismatch between Steam and SGI'
                            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Account%20mismatch%20between%20Steam%20and%20SGI'
                        />,
                        color: 'danger'
                    });
                    logEvent(`Error in (getAchievementData): ${response}`);
                    return;
                }

                if (response?.achievement_data?.achievements) {
                    const hasProtectedAchievements = response.achievement_data.achievements.some(
                        achievement => achievement.protected_achievement === true
                    );
                    if (hasProtectedAchievements) setProtectedAchievements(true);

                    if (response.achievement_data.achievements.length > 0) {
                        // Sort achievements by percent initially - prevents button state flickering
                        response.achievement_data.achievements.sort((a, b) => b.percent - a.percent);
                        setAchievements(response.achievement_data.achievements);
                        setAchievementsUnavailable(false);
                    }
                }

                if (response?.achievement_data?.stats) {
                    const hasProtectedStatistics = response.achievement_data.stats.some(
                        achievement => achievement.protected_stat === true
                    );
                    if (hasProtectedStatistics) setProtectedStatistics(true);

                    if (response.achievement_data.stats.length > 0) {
                        setStatistics(response.achievement_data.stats);
                        setStatisticsUnavailable(false);
                    }
                }

                setIsLoading(false);
            } catch (error) {
                setIsLoading(false);
                setAchievementsUnavailable(true);
                setStatisticsUnavailable(true);
                addToast({ description: 'Error fetching achievement data', color: 'danger' });
                console.error('Error in (getAchievementData):', error);
                logEvent(`Error in (getAchievementData): ${error}`);
            }
        };
        getAchievementData();
    }, [userSummary.steamId, appId, setAchievements, setIsLoading, setProtectedAchievements, setProtectedStatistics, setStatistics, setAchievementsUnavailable, setStatisticsUnavailable]);
}
