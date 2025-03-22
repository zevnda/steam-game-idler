import { lockAllAchievements, unlockAllAchievements } from '@/utils/global/achievements';
import { checkSteamStatus, logEvent } from '@/utils/global/tasks';
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/utils/global/toasts';

export default function useAchievementButtons(userSummary, setAchievements) {
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
            case 'unlocked':
                sortedAchievements.sort((b, a) => (a.achieved === b.achieved) ? 0 : a.achieved ? 1 : -1);
                break;
            case 'locked':
                sortedAchievements.sort((a, b) => (a.achieved === b.achieved) ? 0 : a.achieved ? 1 : -1);
                break;
            case 'protected':
                sortedAchievements.sort((b, a) => {
                    if (a.protected_achievement && !b.protected_achievement) return 1;
                    if (!a.protected_achievement && b.protected_achievement) return -1;
                    return 0;
                });
                break;
            case 'unprotected':
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
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            const success = await unlockAllAchievements(userSummary.steamId, appId, achievements, appName);

            if (success) {
                // Update all achievements at once in the UI
                setAchievements(prevAchievements => {
                    return prevAchievements.map(achievement => {
                        return { ...achievement, achieved: true };
                    });
                });

                showSuccessToast(`Successfully unlocked ${achievements.length} achievements for ${appName}`);
            } else {
                showAccountMismatchToast('danger');
            }
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in handleUnlockAll:', error);
            logEvent(`[Error] in (handleUnlockAll): ${error}`);
        }
    };

    // Handle locking all achievements
    const handleLockAll = async (appId, appName, achievements, onClose) => {
        try {
            onClose();
            // Check if Steam is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            const success = await lockAllAchievements(userSummary.steamId, appId, achievements, appName);

            if (success) {
                // Update all achievements at once in the UI
                setAchievements(prevAchievements => {
                    return prevAchievements.map(achievement => {
                        return { ...achievement, achieved: false };
                    });
                });

                showSuccessToast(`Successfully locked ${achievements.length} achievements for ${appName}`);
            } else {
                showAccountMismatchToast('danger');
            }
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in handleLockAll:', error);
            logEvent(`[Error] in handleLockAll: ${error}`);
        }
    };

    return { handleChange, handleUnlockAll, handleLockAll };
}
