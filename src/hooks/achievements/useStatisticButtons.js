import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { updateStats } from '@/utils/achievements';
import { checkSteamStatus } from '@/utils/tasks';
import { showDangerToast, showSuccessToast, showWarningToast } from '@/utils/toasts';

export default function useStatisticButtons(statistics, setStatistics, changedStats, setChangedStats, setAchievements) {
    const { t } = useTranslation();
    const { userSummary } = useContext(UserContext);
    const { appId, appName } = useContext(StateContext);

    // Handle updating only changed statistics
    const handleUpdateAllStats = async () => {
        // Make sure Steam client is running
        const isSteamRunning = checkSteamStatus(true);
        if (!isSteamRunning) return;

        // Get list of stats that were modified by the user
        const changedKeys = Object.keys(changedStats);

        if (changedKeys.length === 0) {
            return showWarningToast(t('toast.updateAll.noChanges'));
        }

        // Format stats into array of objects with name/value pairs
        // This format is required by SteamUtility
        const valuesArr = changedKeys.map(name => ({
            name,
            value: changedStats[name]
        }));

        // Update stats
        const success = await updateStats(userSummary.steamId, appId, appName, valuesArr, setAchievements);

        if (success) {
            showSuccessToast(t('toast.updateAll.success', { count: changedKeys.length, appName }));
            // Clear the tracked changes after successful update
            setChangedStats({});
        } else {
            showDangerToast(t('toast.updateAll.error'));
        }
    };

    // Handle resetting all statistics
    const handleResetAll = async (onClose) => {
        // Close modla
        onClose();

        // Make sure Steam client is running
        const isSteamRunning = checkSteamStatus(true);
        if (!isSteamRunning) return;

        // Reset all stats
        const response = await invoke('reset_all_stats', { appId });
        const status = JSON.parse(response);

        if (status.success) {
            setStatistics(prevValues => {
                return prevValues.map(stat => ({
                    ...stat,
                    value: 0
                }));
            });

            showSuccessToast(t('toast.resetAll.success', { count: statistics.length, appName }));

            // Clear the tracked changes after successful update
            setChangedStats({});
        } else {
            showDangerToast(t('toast.resetAll.error'));
        }
    };

    return { handleUpdateAllStats, handleResetAll };
}