import { invoke } from '@tauri-apps/api/core';

import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

// Unlock a single achievement for a game
export async function unlockAchievement(steamId, appId, achievementName, appName) {
    try {
        const response = await invoke('unlock_achievement', {
            appId,
            achievementId: achievementName
        });
        await invoke('get_achievement_data', { steamId, appId, refetch: true });
        const status = JSON.parse(response);
        if (status.success) {
            logEvent(`[Achievement Manager] Unlocked ${achievementName} for ${appName} (${appId})`);
            return true;
        } else {
            logEvent(`[Error] [Achievement Manager] Failed to unlock ${achievementName} for ${appName} (${appId})`);
            return false;
        }
    } catch (error) {
        console.error('Error in unlockAchievement util: ', error);
        logEvent(`[Error] in (unlockAchievement) util: ${error}`);
        return false;
    }
}

// Toggle the state of a single achievement for a game
export async function toggleAchievement(steamId, appId, achievementName, appName, type) {
    try {
        const response = await invoke('toggle_achievement', {
            appId,
            achievementId: achievementName
        });
        await invoke('get_achievement_data', { steamId, appId, refetch: true });
        const status = JSON.parse(response);
        if (status.success) {
            showSuccessToast(`${type} ${achievementName} for ${appName}`);
            logEvent(`[Achievement Manager] ${type} ${achievementName} for ${appName} (${appId})`);
            return true;
        } else {
            showDangerToast(`Failed to ${type.replace('ed', '').toLowerCase()} ${achievementName} for ${appName}`);
            logEvent(`[Error] [Achievement Manager] Failed to ${type.replace('ed', '').toLowerCase()} ${achievementName} for ${appName} (${appId})`);
            return false;
        }
    } catch (error) {
        console.error('Error in toggleAchievement util: ', error);
        logEvent(`[Error] in (toggleAchievement) util: ${error}`);
        return false;
    }
}

// Unlock all achievements for a game
export async function unlockAllAchievements(steamId, appId, achievementsArr, appName) {
    try {
        const response = await invoke('unlock_all_achievements', { appId });
        await invoke('get_achievement_data', { steamId, appId, refetch: true });
        const status = JSON.parse(response);
        if (status.success) {
            logEvent(`[Achievement Manager] Unlocked ${achievementsArr.length} achievements for ${appName} (${appId})`);
            return true;
        } else {
            logEvent(`[Error] [Achievement Manager] Failed to unlock all achievements for ${appName} (${appId})`);
            return false;
        }
    } catch (error) {
        console.error('Error in unlockAllAchievements util: ', error);
        logEvent(`[Error] in (unlockAllAchievements) util: ${error}`);
        return false;
    }
}

// Lock all achievements for a game
export async function lockAllAchievements(steamId, appId, achievementsArr, appName) {
    try {
        const response = await invoke('lock_all_achievements', { appId });
        await invoke('get_achievement_data', { steamId, appId, refetch: true });
        const status = JSON.parse(response);
        if (status.success) {
            logEvent(`[Achievement Manager] Locked ${achievementsArr.length} achievements for ${appName} (${appId})`);
            return true;
        } else {
            logEvent(`[Error] [Achievement Manager] Failed to lock all achievements for ${appName} (${appId})`);
            return false;
        }
    } catch (error) {
        console.error('Error in lockAllAchievements util: ', error);
        logEvent(`[Error] in (lockAllAchievements) util: ${error}`);
        return false;
    }
}

// Update statistics for a game
export async function updateStats(steamId, appId, appName, valuesArr, setAchievements) {
    try {
        const response = await invoke('update_stats', {
            appId,
            statsArr: JSON.stringify(valuesArr)
        });
        const newData = await invoke('get_achievement_data', { steamId, appId, refetch: true });
        setAchievements(newData?.achievement_data?.achievements);
        if (response.includes('success')) {
            logEvent(`[Statistics Manager] Updated ${valuesArr.length} stats for ${appName} (${appId})`);
            return true;
        } else {
            logEvent(`[Error] [Statistics Manager] Failed to update stats for ${appName} (${appId})`);
            return false;
        }
    } catch (error) {
        console.error('Error in updateStats util: ', error);
        logEvent(`[Error] in (updateStats) util: ${error}`);
        return false;
    }
}