import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext, useEffect } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { logEvent } from '@/utils/utils';

export default function useAchievements(setIsLoading,
    setAchievements,
    setStatistics,
    setProtectedAchievements,
    setProtectedStatistics,
    setSteamNotRunning
) {
    const { appId } = useContext(StateContext);
    const { setAchievementsUnavailable, setStatisticsUnavailable } = useContext(UserContext);

    useEffect(() => {
        const getAchievementData = async () => {
            try {
                // Check if Steam is running
                const steamRunning = await invoke('check_status');
                if (!steamRunning) {
                    setIsLoading(false);
                    addToast({
                        description: <ErrorToast
                            message='Steam is not running'
                            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                        />,
                        color: 'danger'
                    });
                    return setSteamNotRunning(true);
                }

                const response = await invoke('get_achievement_manager_data', { appId });

                if (response?.achievement_data?.achievements) {
                    const hasProtectedAchievements = response.achievement_data.achievements.some(
                        achievement => achievement.protected_achievement === true
                    );
                    if (hasProtectedAchievements) setProtectedAchievements(true);

                    setAchievements(response.achievement_data.achievements);
                    setAchievementsUnavailable(false);
                }

                if (response?.achievement_data?.stats) {
                    const hasProtectedStatistics = response.achievement_data.stats.some(
                        achievement => achievement.protected_stat === true
                    );
                    if (hasProtectedStatistics) setProtectedStatistics(true);

                    setStatistics(response.achievement_data.stats);
                    setStatisticsUnavailable(false);
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
    }, [appId, setAchievements, setIsLoading, setProtectedAchievements, setProtectedStatistics, setStatistics, setSteamNotRunning, setAchievementsUnavailable, setStatisticsUnavailable]);
}
