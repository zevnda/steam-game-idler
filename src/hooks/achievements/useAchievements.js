import { invoke } from '@tauri-apps/api/core';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { checkSteamStatus, logEvent } from '@/utils/tasks';
import { showAccountMismatchToast, showDangerToast } from '@/utils/toasts';

export default function useAchievements(setIsLoading,
    setAchievements,
    setStatistics,
    setProtectedAchievements,
    setProtectedStatistics,
) {
    const { t } = useTranslation();
    const { appId } = useContext(StateContext);
    const { userSummary, setAchievementsUnavailable, setStatisticsUnavailable } = useContext(UserContext);

    useEffect(() => {
        const getAchievementData = async () => {
            try {
                // Make sure Steam client is running
                const isSteamRunning = checkSteamStatus(true);
                if (!isSteamRunning) return setIsLoading(false);

                // Fetch achievement data
                const response = await invoke('get_achievement_data', { steamId: userSummary.steamId, appId });

                // Handle case where Steam API initialization failed
                // We already check if Steam client is running so usually account mismatch
                if (!response?.achievement_data && response.includes('Failed to initialize Steam API')) {
                    setIsLoading(false);
                    setAchievementsUnavailable(true);
                    setStatisticsUnavailable(true);
                    showAccountMismatchToast('danger');
                    logEvent(`Error in (getAchievementData): ${response}`);
                    return;
                }

                if (response?.achievement_data?.achievements) {
                    // Check if any achievements are marked as protected
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
                    // Check if any statistics are marked as protected
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
                showDangerToast(t('toast.achievementData.error'));
                console.error('Error in (getAchievementData):', error);
                logEvent(`Error in (getAchievementData): ${error}`);
            }
        };
        getAchievementData();
    }, [userSummary.steamId, appId, setAchievements, setIsLoading, setProtectedAchievements, setProtectedStatistics, setStatistics, setAchievementsUnavailable, setStatisticsUnavailable, t]);
}
