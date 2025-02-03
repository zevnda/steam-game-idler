import { invoke } from '@tauri-apps/api/tauri';
import { lockAllAchievements, logEvent, unlockAllAchievements, updateStats } from '@/src/utils/utils';
import { toast } from 'react-toastify';
import ErrorToast from '@/src/components/ui/ErrorToast';

// Handle unlocking all achievements
export const handleUnlockAll = async (appId, appName, achievementList, onClose) => {
    try {
        onClose();
        // Check if Steam is running
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            onClose();
            return toast.error(
                <ErrorToast
                    message={'Steam is not running'}
                    href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                />
            );
        }

        const achievementsArr = achievementList.map(achievement => achievement.name);
        const success = await unlockAllAchievements(appId, achievementsArr, appName);

        if (success) {
            toast.success(`Successfully unlocked ${achievementList.length} achievements for ${appName}`);
        } else {
            toast.error(
                <ErrorToast
                    message={'Are you logged in to the correct account?'}
                    href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                />
            );
        }
    } catch (error) {
        toast.error(`Error in (handleUnlockAll): ${error?.message || error}`);
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
            return toast.error(
                <ErrorToast
                    message={'Steam is not running'}
                    href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                />
            );
        }

        const success = await lockAllAchievements(appId, achievementList, appName);

        if (success) {
            toast.success(`Successfully locked ${achievementList.length} achievements for ${appName}`);
        } else {
            toast.error(
                <ErrorToast
                    message={'Are you logged in to the correct account?'}
                    href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                />
            );
        }
    } catch (error) {
        toast.error(`Error in (handleLockAll): ${error?.message || error}`);
        console.error('Error in handleLockAll:', error);
        logEvent(`[Error] in handleLockAll: ${error}`);
    }
};

// Handle updating all statistics
export const handleUpdateAllStats = async (appId, appName, initialStatValues, newStatValues) => {
    // Filter only values that have changed
    const changedValues = Object.entries(newStatValues)
        .filter(([key, value]) => value !== initialStatValues[key])
        .map(([key, value]) => ({ statName: key, newValue: value }));

    if (changedValues.length === 0) {
        return toast.info('No changes to save.');
    }

    // Check if Steam is running
    const steamRunning = await invoke('check_status');
    if (!steamRunning) {
        return toast.error(
            <ErrorToast
                message={'Steam is not running'}
                href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
            />
        );
    }

    const success = await updateStats(appId, changedValues, appName);

    if (success) {
        toast.success(`Successfully updated ${changedValues.length} stats for ${appName}`);
    } else {
        toast.error(
            <ErrorToast
                message={'Are you logged in to the correct account?'}
                href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
            />
        );
    }
};

// Handle resetting all statistics
export const handleResetAll = async (appId, appName, setNewStatValues, onClose) => {
    onClose();

    // Check if Steam is running
    const steamRunning = await invoke('check_status');
    if (!steamRunning) {
        return toast.error(
            <ErrorToast
                message={'Steam is not running'}
                href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
            />
        );
    }

    const response = await invoke('reset_all_stats', { appId: appId });
    const status = JSON.parse(response);
    if (status.success) {
        setNewStatValues(prevValues => {
            const resetValues = {};
            for (const key in prevValues) {
                resetValues[key] = 0;
            }
            return resetValues;
        });
        toast.success(`Successfully reset all stats for ${appName}`);
    } else {
        toast.error(
            <ErrorToast
                message={'Are you logged in to the correct account?'}
                href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
            />,
            { autoClose: 5000 }
        );
    }
};