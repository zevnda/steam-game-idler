import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { updateStats } from '@/utils/utils';

export default function useStatisticButtons(statistics, setStatistics, changedStats, setChangedStats, setAchievements) {
    const { userSummary } = useContext(UserContext);
    const { appId, appName } = useContext(StateContext);

    // Handle updating only changed statistics
    const handleUpdateAllStats = async () => {
        const changedKeys = Object.keys(changedStats);

        if (changedKeys.length === 0) {
            return addToast({ description: 'No statistics have been modified', color: 'warning' });
        }

        const valuesArr = changedKeys.map(name => ({
            name,
            value: changedStats[name]
        }));

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

        const success = await updateStats(userSummary.steamId, appId, appName, valuesArr, setAchievements);

        if (success) {
            addToast({ description: `Successfully updated ${changedKeys.length} stats for ${appName}`, color: 'success' });
            setChangedStats({});
        } else {
            addToast({
                description: 'Unavailable to update statistics',
                color: 'danger'
            });
        }
    };

    // Handle resetting all statistics
    const handleResetAll = async (onClose) => {
        onClose();

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
            addToast({ description: `Successfully reset ${statistics.length} stats for ${appName}`, color: 'success' });
        } else {
            addToast({
                description: 'Unavailable to reset statistics',
                color: 'danger'
            });
        }
    };

    return { handleUpdateAllStats, handleResetAll };
}