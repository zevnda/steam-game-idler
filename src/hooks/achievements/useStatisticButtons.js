import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { updateStats } from '@/utils/utils';

export default function useStatisticButtons(statistics, setStatistics) {
    const { appId, appName } = useContext(StateContext);

    // Handle updating all statistics
    const handleUpdateAllStats = async () => {
        const valuesArr = statistics.map(stat => ({
            name: stat.id,
            value: stat.value
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

        const success = await updateStats(appId, appName, valuesArr);

        if (success) {
            addToast({ description: `Successfully updated ${statistics.length} stats for ${appName}`, color: 'success' });
        } else {
            addToast({
                description: <ErrorToast
                    message='Are you logged in to the correct account?'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'
                />,
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
            addToast({ description: `Successfully reset ${statistics.length} stats for ${appName}`, color: 'success' });
        } else {
            addToast({
                description: <ErrorToast
                    message='Are you logged in to the correct account?'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'
                />,
                color: 'danger'
            });
        }
    };

    return { handleUpdateAllStats, handleResetAll };
}