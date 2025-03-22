import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { updateStats } from '@/utils/global/achievements';
import { checkSteamStatus } from '@/utils/global/tasks';
import { showDangerToast, showSuccessToast, showWarningToast } from '@/utils/global/toasts';

export default function useStatisticButtons(statistics, setStatistics, changedStats, setChangedStats, setAchievements) {
    const { userSummary } = useContext(UserContext);
    const { appId, appName } = useContext(StateContext);

    // Handle updating only changed statistics
    const handleUpdateAllStats = async () => {
        const changedKeys = Object.keys(changedStats);

        if (changedKeys.length === 0) {
            return showWarningToast('No statistics have been modified');
        }

        const valuesArr = changedKeys.map(name => ({
            name,
            value: changedStats[name]
        }));

        // Check if Steam is running
        const isSteamRunning = checkSteamStatus(true);
        if (!isSteamRunning) return;

        const success = await updateStats(userSummary.steamId, appId, appName, valuesArr, setAchievements);

        if (success) {
            showSuccessToast(`Successfully updated ${changedKeys.length} stats for ${appName}`);
            setChangedStats({});
        } else {
            showDangerToast('Unable to update statistics');
        }
    };

    // Handle resetting all statistics
    const handleResetAll = async (onClose) => {
        onClose();

        // Check if Steam is running
        const isSteamRunning = checkSteamStatus(true);
        if (!isSteamRunning) return;

        const response = await invoke('reset_all_stats', { appId });
        const status = JSON.parse(response);
        if (status.success) {
            setStatistics(prevValues => {
                return prevValues.map(stat => ({
                    ...stat,
                    value: 0
                }));
            });
            setChangedStats({});
            showSuccessToast(`Successfully reset ${statistics.length} stats for ${appName}`);
        } else {
            showDangerToast('Unable to reset statistics');
        }
    };

    return { handleUpdateAllStats, handleResetAll };
}