import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

import ErrorToast from '@/components/ui/ErrorToast';
import { lockAllAchievements, logEvent, unlockAllAchievements } from '@/utils/utils';

export default function useAchievementButtons(achievements, setAchievements) {
    useEffect(() => {
        if (achievements?.length) {
            const sortedList = [...achievements].sort((a, b) =>
                b.percent - a.percent
            );
            setAchievements(sortedList);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle change in sorting option
    const handleChange = (e, achievements, setAchievements) => {
        const selectedKey = Array.from(e)[0];
        const sortedAchievements = [...achievements];

        switch (selectedKey) {
            case 'percent':
                sortedAchievements.sort((b, a) => (a.percent || 0) - (b.percent || 0));
                break;
            case 'title':
                sortedAchievements.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'state':
                sortedAchievements.sort((b, a) => (a.achieved === b.achieved) ? 0 : a.achieved ? 1 : -1);
                break;
            case 'protected':
                sortedAchievements.sort((a, b) => {
                    if (a.protected_achievement && !b.protected_achievement) return 1;
                    if (!a.protected_achievement && b.protected_achievement) return -1;
                    return 0;
                });
                break;
            default:
                break;
        }

        setAchievements(sortedAchievements);
    };

    // Handle unlocking all achievements
    const handleUnlockAll = async (appId, appName, achievements, onClose) => {
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

            const success = await unlockAllAchievements(appId, achievements, appName);

            if (success) {
                // Update all achievements at once in the UI
                setAchievements(prevAchievements => {
                    return prevAchievements.map(achievement => {
                        return { ...achievement, achieved: true };
                    });
                });

                addToast({ description: `Successfully unlocked ${achievements.length} achievements for ${appName}`, color: 'success' });
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
    const handleLockAll = async (appId, appName, achievements, onClose) => {
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

            const success = await lockAllAchievements(appId, achievements, appName);

            if (success) {
                // Update all achievements at once in the UI
                setAchievements(prevAchievements => {
                    return prevAchievements.map(achievement => {
                        return { ...achievement, achieved: false };
                    });
                });

                addToast({ description: `Successfully locked ${achievements.length} achievements for ${appName}`, color: 'success' });
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

    return { handleChange, handleUnlockAll, handleLockAll };
}
