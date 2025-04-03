import { invoke } from '@tauri-apps/api/core';
import type { Dispatch, SetStateAction } from 'react';

import type { Achievement, StatValue, InvokeStatUpdate, InvokeAchievementData, InvokeAchievementUnlock } from '@/types';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast, t } from '@/utils/toasts';

// Unlock a single achievement for a game
export async function unlockAchievement(
    steamId: string | undefined,
    appId: number,
    achievementName: string,
    appName: string
): Promise<boolean> {
    try {
        const response = await invoke<InvokeAchievementUnlock>('unlock_achievement', {
            appId,
            achievementId: achievementName
        });

        await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true });

        const status = JSON.parse(String(response)) as InvokeAchievementUnlock;

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
export async function toggleAchievement(
    steamId: string | undefined,
    appId: number,
    achievementName: string,
    appName: string,
    type: string
): Promise<boolean> {
    try {
        const response = await invoke<InvokeAchievementUnlock>('toggle_achievement', {
            appId,
            achievementId: achievementName
        });

        await invoke('get_achievement_data', { steamId, appId, refetch: true });

        const status = JSON.parse(String(response)) as InvokeAchievementUnlock;

        if (status.success) {
            showSuccessToast(t('toast.toggle.success', { type, achievementName, appName }));
            logEvent(`[Achievement Manager] ${type} ${achievementName} for ${appName} (${appId})`);
            return true;
        } else {
            showDangerToast(t('toast.toggle.error', { type: type.replace('ed', '').toLowerCase(), achievementName, appName }));
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
export async function unlockAllAchievements(
    steamId: string | undefined,
    appId: number,
    achievementsArr: Achievement[],
    appName: string
): Promise<boolean> {
    try {
        const response = await invoke<InvokeAchievementUnlock>('unlock_all_achievements', { appId });

        await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true });

        const status = JSON.parse(String(response)) as InvokeAchievementUnlock;

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
export async function lockAllAchievements(
    steamId: string | undefined,
    appId: number,
    achievementsArr: Achievement[],
    appName: string
): Promise<boolean> {
    try {
        const response = await invoke<InvokeAchievementUnlock>('lock_all_achievements', { appId });

        await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true });

        const status = JSON.parse(String(response)) as InvokeAchievementUnlock;

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
export async function updateStats(
    steamId: string | undefined,
    appId: number | null,
    appName: string | null,
    valuesArr: StatValue[],
    setAchievements: Dispatch<SetStateAction<Achievement[]>>
): Promise<boolean> {
    try {
        const response = await invoke<InvokeStatUpdate>('update_stats', {
            appId,
            statsArr: JSON.stringify(valuesArr)
        });

        const statusStr = String(response).split(/(?<=})\s*(?={)/)[0];

        const status = JSON.parse(statusStr) as InvokeStatUpdate;

        const newData = await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true });

        setAchievements(newData?.achievement_data?.achievements);

        if (status.success) {
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