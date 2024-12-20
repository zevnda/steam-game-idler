import { invoke } from '@tauri-apps/api/tauri';
import { logEvent, unlockAchievement, lockAchievement, updateStat } from '@/src/utils/utils';
import { toast } from 'react-toastify';

export const handleUnlockAll = async (appId, appName, achievementList, setBtnLoading, onClose) => {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            setBtnLoading(true);
            onClose();
            let unlocked = 0;
            const total = achievementList.length;
            const toastId = toast.info(`Unlocking 0 of ${total} achievements for ${appName}.`, {
                autoClose: false,
                isLoading: true,
                closeButton: false
            });
            for (const ach of achievementList) {
                try {
                    await unlockAchievement(appId, ach.name);
                    unlocked++;
                    toast.update(toastId, {
                        render: `Unlocking ${unlocked} of ${total} achievements for ${appName}.`,
                    });
                } catch (error) {
                    console.error(`Failed to unlock achievement ${ach.name}:`, error);
                }
            }
            setBtnLoading(false);
            toast.update(toastId, {
                render: `Successfully unlocked ${unlocked} of ${total} achievements for ${appName}.`,
                autoClose: true,
                isLoading: false,
                closeButton: true,
                type: 'success'
            });
        } else {
            onClose();
            toast.error('Steam is not running');
        }
    } catch (error) {
        toast.error(`Error in (handleUnlockAll): ${error?.message || error}`);
        console.error('Error in handleUnlockAll:', error);
        logEvent(`[Error] in (handleUnlockAll): ${error}`);
    }
};

export const handleLockAll = async (appId, appName, achievementList, setBtnLoading, onClose) => {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            setBtnLoading(true);
            onClose();
            let locked = 0;
            const total = achievementList.length;
            const toastId = toast.info(`Locking 0 of ${total} achievements for ${appName}.`, {
                autoClose: false,
                isLoading: true,
                closeButton: false
            });
            for (const ach of achievementList) {
                try {
                    await lockAchievement(appId, ach.name);
                    locked++;
                    toast.update(toastId, {
                        render: `Locking ${locked} of ${total} achievements for ${appName}.`,
                    });
                } catch (error) {
                    console.error(`Failed to lock achievement ${ach.name}:`, error);
                }
            }
            setBtnLoading(false);
            toast.update(toastId, {
                render: `Successfully locked ${locked} of ${total} achievements for ${appName}.`,
                autoClose: true,
                isLoading: false,
                closeButton: true,
                type: 'success'
            });
        } else {
            onClose();
            toast.error('Steam is not running');
        }
    } catch (error) {
        toast.error(`Error in (handleLockAll): ${error?.message || error}`);
        console.error('Error in handleLockAll:', error);
        logEvent(`[Error] in handleLockAll: ${error}`);
    }
};

export const handleUpdateAll = async (appId, appName, initialStatValues, newStatValues) => {
    const changedValues = Object.entries(newStatValues).filter(([key, value]) => {
        return value !== initialStatValues[key];
    });

    if (changedValues.length < 1) {
        toast.info('No changes to save.');
    }

    for (const [statName, newValue] of changedValues) {
        try {
            const status = await updateStat(appId, statName, newValue.toString() || '0');
            if (!status.error) {
                toast.success(`Updated ${statName} to ${newValue} for ${appName}`);
            } else {
                toast.error(`Error: ${status.error}`);
            }
        } catch (error) {
            toast.error(`Error in (handleUpdate): ${error?.message || error}`);
            console.error('Error in (handleUpdate):', error);
            logEvent(`[Error] in (handleUpdate): ${error}`);
        }
    }
};
