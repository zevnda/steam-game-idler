import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';

import ErrorToast from '@/components/ui/ErrorToast';
import { lockAllAchievements, logEvent, unlockAllAchievements, updateStats } from '@/utils/utils';

// Handle unlocking all achievements
export const handleUnlockAll = async (appId, appName, achievementList, onClose) => {
    try {
        onClose();
        // Check if Steam is running
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            onClose();
            return addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }

        const achievementsArr = achievementList.map(achievement => achievement.name);
        const success = await unlockAllAchievements(appId, achievementsArr, appName);

        if (success) {
            addToast({ description: `Successfully unlocked ${achievementList.length} achievements for ${appName}`, color: 'success' });
        } else {
            addToast({
                description: <ErrorToast
                    message='Are you logged in to the correct account?'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'
                />,
                color: 'danger'
            });
        }
    } catch (error) {
        addToast({ description: `Error in (handleUnlockAll): ${error?.message || error}`, color: 'danger' });
        console.error('Error in handleUnlockAll:', error);
        logEvent(`[Error] in (handleUnlockAll): ${error}`);
    }
};

// Handle locking all achievements
export const handleLockAll = async (appId, appName, achievementList, onClose) => {
    try {
        onClose();
        // Check if Steam is running
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            onClose();
            return addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }

        const success = await lockAllAchievements(appId, achievementList, appName);

        if (success) {
            addToast({ description: `Successfully locked ${achievementList.length} achievements for ${appName}`, color: 'success' });
        } else {
            addToast({
                description: <ErrorToast
                    message='Are you logged in to the correct account?'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'
                />,
                color: 'danger'
            });
        }
    } catch (error) {
        addToast({ description: `Error in (handleLockAll): ${error?.message || error}`, color: 'danger' });
        console.error('Error in handleLockAll:', error);
        logEvent(`[Error] in handleLockAll: ${error}`);
    }
};

// Handle updating all statistics
export const handleUpdateAllStats = async (appId, appName, initialStatValues, newStatValues) => {
    // Filter only values that have changed
    const changedValues = Object.entries(newStatValues)
        .filter(([key, value]) => value !== initialStatValues[key])
        .map(([key, value]) => ({ name: key, value }));

    if (changedValues.length === 0) {
        return addToast({ description: 'No changes to save.', color: 'info' });
    }

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

    const success = await updateStats(appId, changedValues, appName);

    if (success) {
        addToast({ description: `Successfully updated ${changedValues.length} stats for ${appName}`, color: 'success' });
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
export const handleResetAll = async (appId, appName, setNewStatValues, onClose) => {
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
        setNewStatValues(prevValues => {
            const resetValues = {};
            for (const key in prevValues) {
                resetValues[key] = 0;
            }
            return resetValues;
        });
        addToast({ description: `Successfully reset all stats for ${appName}`, color: 'success' });
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