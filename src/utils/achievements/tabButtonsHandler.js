import { invoke } from '@tauri-apps/api/tauri';
import { logEvent, unlockAchievement, lockAchievement, updateStat, getFilePath } from '@/src/utils/utils';
import { toast } from 'react-toastify';
import ErrorToast from '@/src/components/ui/ErrorToast';

// Handle unlocking all achievements
export const handleUnlockAll = async (appId, appName, achievementList, setBtnLoading, onClose) => {
    try {
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

        setBtnLoading(true);
        onClose();

        let unlocked = 0;
        const total = achievementList.length;
        const toastId = toast.info(`Unlocking 0 of ${total} achievements for ${appName}.`, {
            autoClose: false,
            isLoading: true,
            closeButton: false
        });
        // Loop through each achievement and unlock it
        let failed;
        for (const achievement of achievementList) {
            const error = await unlockAchievement(appId, achievement.name, appName);
            if (!error) {
                unlocked++;
                toast.update(toastId, {
                    render: `Unlocking ${unlocked} of ${total} achievements for ${appName}.`,
                });
            } else {
                failed = true;
                toast.update(toastId, {
                    render: <ErrorToast
                        message={'Are you logged in to the correct account?'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                    />,
                    isLoading: false,
                    autoClose: 5000,
                    type: 'error'
                });
                break;
            }
        }
        setBtnLoading(false);
        if (!failed) {
            toast.update(toastId, {
                render: `Successfully unlocked ${unlocked} of ${total} achievements for ${appName}.`,
                autoClose: true,
                isLoading: false,
                closeButton: true,
                type: 'success'
            });
        }
    } catch (error) {
        toast.error(`Error in (handleUnlockAll): ${error?.message || error}`);
        console.error('Error in handleUnlockAll:', error);
        logEvent(`[Error] in (handleUnlockAll): ${error}`);
    }
};

// Handle locking all achievements
export const handleLockAll = async (appId, appName, achievementList, setBtnLoading, onClose) => {
    try {
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

        setBtnLoading(true);
        onClose();

        let locked = 0;
        const total = achievementList.length;
        const toastId = toast.info(`Locking 0 of ${total} achievements for ${appName}.`, {
            autoClose: false,
            isLoading: true,
            closeButton: false
        });
        // Loop through each achievement and lock it
        let failed;
        for (const achievement of achievementList) {
            const error = await lockAchievement(appId, achievement.name, appName);
            if (!error) {
                locked++;
                toast.update(toastId, {
                    render: `Locking ${locked} of ${total} achievements for ${appName}.`,
                });
            } else {
                failed = true;
                toast.update(toastId, {
                    render: <ErrorToast
                        message={'Are you logged in to the correct account?'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                    />,
                    autoClose: 5000,
                    isLoading: false,
                    type: 'error'
                });
                break;
            }
        }
        setBtnLoading(false);
        if (!failed) {
            toast.update(toastId, {
                render: `Successfully locked ${locked} of ${total} achievements for ${appName}.`,
                autoClose: true,
                isLoading: false,
                closeButton: true,
                type: 'success'
            });
        }
    } catch (error) {
        toast.error(`Error in (handleLockAll): ${error?.message || error}`);
        console.error('Error in handleLockAll:', error);
        logEvent(`[Error] in handleLockAll: ${error}`);
    }
};

// Handle updating all statistics
export const handleUpdateAll = async (appId, appName, initialStatValues, newStatValues, setBtnLoading) => {
    // Filter only values that have changed
    const changedValues = Object.entries(newStatValues).filter(([key, value]) => {
        return value !== initialStatValues[key];
    });

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

    setBtnLoading(true);

    const toastId = toast.info('Updating statistics', {
        autoClose: false,
        isLoading: true,
        closeButton: false
    });

    // Loop through each changed value and update it

    let failed;
    for (const [statName, newValue] of changedValues) {
        try {
            const error = await updateStat(appId, statName, newValue.toString() || '0', appName);
            if (!error) {
                toast.update(toastId, {
                    render: `Updated ${statName} to ${newValue} for ${appName}`,
                });
            } else {
                failed = true;
                toast.update(toastId, {
                    render: <ErrorToast
                        message={'Are you logged in to the correct account?'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                    />,
                    autoClose: 5000,
                    isLoading: false,
                    type: 'error'
                });
                break;
            }
        } catch (error) {
            toast.error(`Error in (handleUpdate): ${error?.message || error}`);
            console.error('Error in (handleUpdate):', error);
            logEvent(`[Error] in (handleUpdate): ${error}`);
        }
    }

    setBtnLoading(false);

    if (!failed) {
        toast.update(toastId, {
            render: `Completed updating statistics for ${appName}`,
            autoClose: true,
            isLoading: false,
            closeButton: true,
            type: 'success'
        });
    }
};

// Handle resetting all statistics
export const handleResetAll = async (appId, setBtnLoading, setNewStatValues, onClose) => {
    onClose();
    setBtnLoading(true);
    const response = await invoke('reset_stats', { filePath: await getFilePath(), appId: appId.toString() });
    const status = JSON.parse(response);
    if (!status.error) {
        setNewStatValues(prevValues => {
            const resetValues = {};
            for (const key in prevValues) {
                resetValues[key] = 0;
            }
            return resetValues;
        });
        toast.success('All stats successfully reset');
    } else {
        toast.error(
            <ErrorToast
                message={'Are you logged in to the correct account?'}
                href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
            />,
            { autoClose: 5000 }
        );
    }
    setBtnLoading(false);
};