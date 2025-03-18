import { addToast } from '@heroui/react';
import { Time } from '@internationalized/date';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

import ErrorToast from '@/components/ui/ErrorToast';

const idleTimeouts = {};
const idleIntervals = {};
let antiAwayInterval = null;

// Start idling a game
export async function startIdle(appId, appName, quiet = false, manual = true) {
    try {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        const maxIdleTime = gameSettings[appId]?.maxIdleTime || 0;
        const stealthIdle = settings?.general?.stealthIdle;

        const steamRunning = await invoke('check_status');

        if (steamRunning) {
            // Make sure the idler is not already running
            const notRunningIds = await invoke('check_process_by_game_id', { ids: [appId.toString()] });
            if (!notRunningIds.includes(appId.toString())) {
                return addToast({ description: `${appName} (${appId}) is already being idled`, color: 'info' });
            }

            const response = await invoke('start_idle', {
                appId: parseInt(appId),
                quiet: stealthIdle ? stealthIdle : quiet
            });

            // Wait for the idler to start before checking the process, used for quiet mode
            setTimeout(async () => {
                await invoke('check_process_by_game_id', { ids: [appId.toString()] });
            }, 1000);

            const status = JSON.parse(response);
            if (!status.error) {
                if (manual && maxIdleTime > 0) {
                    idleTimeouts[appId] = setTimeout(() => {
                        stopIdle(appId, appName);
                    }, maxIdleTime * 60000);

                    // Start polling to check if the idler process is still running
                    idleIntervals[appId] = setInterval(async () => {
                        const notRunningIds = await invoke('check_process_by_game_id', { ids: Object.keys(idleTimeouts) });
                        if (notRunningIds.includes(appId.toString())) {
                            clearTimeout(idleTimeouts[appId]);
                            clearInterval(idleIntervals[appId]);
                            delete idleTimeouts[appId];
                            delete idleIntervals[appId];
                        }
                    }, 5000);
                }
                logEvent(`[Idle] Started idling ${appName} (${appId})`);
                return true;
            } else {
                console.error(`Error starting idler for ${appName} (${appId}): ${status.error}`);
                addToast({
                    description: <ErrorToast
                        message='Are you logged in to the correct account?'
                        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'
                    />,
                    color: 'danger'
                });
                logEvent(`[Error] [Idle] Failed to idle ${appName} (${appId}) - account mismatch`);
            }
        } else {
            console.error('Steam is not running');
            addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }
    } catch (error) {
        console.error('Error in startIdle util: ', error);
        logEvent(`[Error] in (startIdle) util: ${error}`);
    }
};

// Stop idling a game
export async function stopIdle(appId, appName) {
    try {
        if (idleTimeouts[appId]) {
            clearTimeout(idleTimeouts[appId]);
            delete idleTimeouts[appId];
        }
        if (idleIntervals[appId]) {
            clearInterval(idleIntervals[appId]);
            delete idleIntervals[appId];
        }
        await invoke('stop_idle', { appId: parseInt(appId) });
        logEvent(`[Idle] Stopped idling ${appName} (${appId})`);
    } catch (error) {
        console.error('Error in stopIdle util (these errors can often be ignored): ', error);
    }
};

// Start farming idle
export async function startFarmIdle(appIds) {
    try {
        const steamRunning = await invoke('check_status');

        if (steamRunning) {
            await invoke('start_farm_idle', { appIds });
            logEvent(`[Card Farming] Started idling ${appIds.length} games`);
        } else {
            console.error('Steam is not running');
            addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }
    } catch (error) {
        console.error('Error in startFarmIdle util: ', error);
        logEvent(`[Error] in (startFarmIdle) util: ${error}`);
    }
}

// Stop farming idle
export async function stopFarmIdle(appIds) {
    try {
        await invoke('stop_farm_idle');
        logEvent(`[Card Farming] Stopped idling ${appIds.length} games`);
    } catch (error) {
        console.error('Error in stopFarmIdle util (these errors can often be ignored): ', error);
    }
}

// Unlock a single achievement for a game
export async function unlockAchievement(appId, achievementName, appName) {
    try {
        const response = await invoke('unlock_achievement', {
            appId,
            achievementId: achievementName
        });
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

// Lock a single achievement for a game
export async function lockAchievement(appId, achievementName, appName) {
    try {
        const response = await invoke('lock_achievement', {
            appId,
            achievementId: achievementName
        });
        const status = JSON.parse(response);
        if (status.success) {
            logEvent(`[Achievement Manager] Locked ${achievementName} for ${appName} (${appId})`);
        } else {
            logEvent(`[Error] [Achievement Manager] Failed to lock ${achievementName} for ${appName} (${appId})`);
        }
    } catch (error) {
        console.error('Error in lockAchievement util: ', error);
        logEvent(`[Error] in (lockAchievement) util: ${error}`);
    }
}

// Toggle the state of a single achievement for a game
export async function toggleAchievement(steamId, appId, achievementName, appName, type) {
    try {
        const response = await invoke('toggle_achievement', {
            appId,
            achievementId: achievementName
        });
        await invoke('get_achievement_manager_data', { steamId, appId, refetch: true });
        const status = JSON.parse(response);
        if (status.success) {
            addToast({ description: `${type} ${achievementName} for ${appName}`, color: 'success' });
            logEvent(`[Achievement Manager] ${type} ${achievementName} for ${appName} (${appId})`);
            return true;
        } else {
            addToast({ description: `Failed to ${type.replace('ed', '').toLowerCase()} ${achievementName} for ${appName}`, color: 'danger' });
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
        await invoke('get_achievement_manager_data', { steamId, appId, refetch: true });
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
        await invoke('get_achievement_manager_data', { steamId, appId, refetch: true });
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
        const newData = await invoke('get_achievement_manager_data', { steamId, appId, refetch: true });
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

// Check remaining card drops for a game
export async function checkDrops(steamId, appId, sid, sls, sma) {
    try {
        const res = await invoke('get_drops_remaining', { sid, sls, sma, steamid: steamId, appId: appId.toString() });
        if (res && res.remaining) {
            return res.remaining;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error in checkDrops util: ', error);
        logEvent(`[Error] in (checkDrops) util: ${error}`);
        return 0;
    }
}

// Get all games with remaining card drops
export async function getAllGamesWithDrops(steamId, sid, sls, sma) {
    try {
        const res = await invoke('get_games_with_drops', { sid, sls, sma, steamid: steamId });
        if (res.gamesWithDrops && res.gamesWithDrops.length > 0) {
            return res.gamesWithDrops;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in getAllGamesWithDrops util: ', error);
        logEvent(`[Error] in (getAllGamesWithDrops) util: ${error}`);
        return false;
    }
}

// Log an event with the current app version
export async function logEvent(message) {
    try {
        const version = await getVersion();
        await invoke('log_event', { message: `[v${version}] ${message}` });
    } catch (error) {
        console.error('Error in logEvent util: ', error);
    }
};

// Check if the current time is within the specified schedule
export function isWithinSchedule(scheduleFrom, scheduleTo) {
    const now = new Date();
    const currentTime = new Time(now.getHours(), now.getMinutes());
    const scheduleFromTime = new Time(scheduleFrom.hour, scheduleFrom.minute);
    const scheduleToTime = new Time(scheduleTo.hour, scheduleTo.minute);
    if (scheduleToTime.compare(scheduleFromTime) < 0) {
        return currentTime.compare(scheduleFromTime) >= 0 || currentTime.compare(scheduleToTime) < 0;
    } else {
        return currentTime.compare(scheduleFromTime) >= 0 && currentTime.compare(scheduleToTime) < 0;
    }
}

// Fetch the latest data from a remote source
export async function fetchLatest() {
    try {
        const res = await fetch('https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json');
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error in (fetchLatest):', error);
        logEvent(`[Error] in (fetchLatest): ${error}`);
        return null;
    }
};

// Fetch free games from a remote source
export async function fetchFreeGames() {
    try {
        const res = await invoke('get_free_games');
        if (res) {
            return res;
        }
        return [];
    } catch (error) {
        console.error('Error in (fetchFreeGames):', error);
        logEvent(`[Error] in (fetchFreeGames): ${error}`);
        return false;
    }
}

// Manage the anti-away status
export async function antiAwayStatus(active = null) {
    try {
        const steamRunning = await invoke('check_status');
        if (!steamRunning) return;
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const { antiAway } = settings?.general || {};
        const shouldRun = active !== null ? active : antiAway;
        if (shouldRun) {
            await invoke('anti_away');
            if (!antiAwayInterval) {
                antiAwayInterval = setInterval(async () => {
                    await invoke('anti_away');
                }, 3 * 60 * 1000);
            }
        } else {
            if (antiAwayInterval) {
                clearInterval(antiAwayInterval);
                antiAwayInterval = null;
            }
        }
    } catch (error) {
        console.error('Error in (antiAwayStatus):', error);
        logEvent(`[Error] in (antiAwayStatus): ${error}`);
    }
}

// Send a native notification
export async function sendNativeNotification(title, body) {
    try {
        let permissionGranted = await isPermissionGranted();

        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }

        if (permissionGranted) {
            sendNotification({ title, body, });
        }
    } catch (error) {
        console.error('Error in (sendNativeNotification):', error);
        logEvent(`[Error] in (sendNativeNotification): ${error}`);
    }
}

// Clear local/session storage but preserving important keys
export const preserveKeysAndClearData = async () => {
    try {
        const keysToPreserve = ['theme', 'minToTrayNotified', 'seenNotifications', 'hasUpdated'];

        const preservedData = keysToPreserve.reduce((acc, key) => {
            const value = localStorage.getItem(key);
            if (value) acc[key] = value;
            return acc;
        }, {});

        localStorage.clear();
        sessionStorage.clear();

        await invoke('delete_all_cache_files');

        Object.entries(preservedData).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    } catch (error) {
        addToast({ description: `Error in (preserveKeysAndClearData): ${error?.message || error}`, color: 'danger' });
        console.error('Error in (preserveKeysAndClearData):', error);
        logEvent(`[Error] in (preserveKeysAndClearData): ${error}`);
    }
};

// Delay execution for a specified amount of time
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Debounce a function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format time in HH:MM:SS format
export function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Get a random delay between a minimum and maximum value
export function getRandomDelay(min, max) {
    return Math.floor(Math.random() * ((max - min) * 60 * 1000 + 1)) + min * 60 * 1000;
};