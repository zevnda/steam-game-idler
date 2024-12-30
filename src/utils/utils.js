import moment from 'moment';
import { invoke } from '@tauri-apps/api/tauri';
import { getVersion } from '@tauri-apps/api/app';
import { Time } from '@internationalized/date';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
import axios from 'axios';
import { toast } from 'react-toastify';
import ErrorToast from '../components/ui/components/ErrorToast';

const idleTimeouts = {};
const idleIntervals = {};
// eslint-disable-next-line no-unused-vars
let idleCounter = 0;
// eslint-disable-next-line no-unused-vars
let achievementCounter = 0;
let antiAwayInterval = null;
let filePath = null;

// Get the file path of the SteamUtility executable
export async function getFilePath() {
    try {
        if (!filePath) {
            const path = await invoke('get_file_path');
            const fullPath = path.replace('Steam Game Idler.exe', 'libs\\SteamUtility.exe');
            filePath = fullPath;
            return fullPath;
        } else {
            return filePath;
        }
    } catch (error) {
        console.error('Error in getFilePath util: ', error);
        logEvent(`[Error] in (getFilePath) util: ${error}`);
    }
}

// Start idling a game
export async function startIdler(appId, appName, quiet = false, manual = true) {
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
                return toast.error(`${appName} (${appId}) is already being idled`);
            }

            const response = await invoke('start_idle', {
                filePath: await getFilePath(),
                appId: appId.toString(),
                quiet: stealthIdle ? stealthIdle.toString() : quiet.toString()
            });

            const status = JSON.parse(response);
            if (!status.error) {
                if (manual && maxIdleTime > 0) {
                    idleTimeouts[appId] = setTimeout(() => {
                        stopIdler(appId, appName);
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
                idleCounter++;
                updateMongoStats('idle');
                logEvent(`[Idle] Started ${appName} (${appId})`);
            } else {
                console.error(`Error starting idler for ${appName} (${appId}): ${status.error}`);
                toast.error(
                    <ErrorToast
                        message={'Are you logged in to the correct account?'}
                        href={'https://github.com/zevnda/steam-game-idler/wiki/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                    />,
                    { autoClose: 5000 }
                );
                logEvent(`[Error] [Idle] Failed to idle ${appName} (${appId}) - account mismatch`);
            }
        } else {
            console.error('Steam is not running');
            toast.error(
                <ErrorToast
                    message={'Steam is not running'}
                    href={'https://github.com/zevnda/steam-game-idler/wiki/faq#error-messages:~:text=Steam%20is%20not%20running'}
                />
            );
        }
    } catch (error) {
        console.error(`Error in startIdler util: ${error}`);
        logEvent(`[Error] in (startIdler) util: ${error}`);
    }
};

// Stop idling a game
export async function stopIdler(appId, appName) {
    try {
        if (idleTimeouts[appId]) {
            clearTimeout(idleTimeouts[appId]);
            delete idleTimeouts[appId];
        }
        if (idleIntervals[appId]) {
            clearInterval(idleIntervals[appId]);
            delete idleIntervals[appId];
        }
        await invoke('stop_idle', { appId: appId.toString() });
        logEvent(`[Idling] Stopped ${appName} (${appId})`);
    } catch (error) {
        console.error('Error in stopIdler util: ', error);
    }
};

// Toggle an achievement for a game
export async function toggleAchievement(appId, appName, achievementName, type) {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            const response = await invoke('toggle_achievement', {
                filePath: await getFilePath(),
                appId: appId.toString(),
                achievementId: achievementName
            });
            const status = JSON.parse(response);
            if (!status.error) {
                achievementCounter++;
                toast.success(`${type} ${achievementName} for ${appName} (${appId})`);
                updateMongoStats('achievement');
                logEvent(`[Achievement Unlocker] ${type} ${achievementName} for ${appName} (${appId})`);
            } else {
                toast.error(
                    <ErrorToast
                        message={'Are you logged in to the correct account?'}
                        href={'https://github.com/zevnda/steam-game-idler/wiki/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'}
                    />,
                    { autoClose: 5000 }
                );
                logEvent(
                    `[Error] [Achievement Unlocker] Failed to ${type.replace('ed', '').toLowerCase()} ${achievementName} for ${appName} (${appId}) - account mismatch`
                );
            }
            return true;
        } else {
            toast.error(
                <ErrorToast
                    message={'Steam is not running'}
                    href={'https://github.com/zevnda/steam-game-idler/wiki/faq#error-messages:~:text=Steam%20is%20not%20running'}
                />
            );
        }
    } catch (error) {
        console.error('Error in toggleAchievement util: ', error);
        logEvent(`[Error] in (toggleAchievement) util: ${error}`);
    }
}

// Unlock an achievement for a game
export async function unlockAchievement(appId, achievementName, appName) {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            const response = await invoke('unlock_achievement', {
                filePath: await getFilePath(),
                appId: appId.toString(),
                achievementId: achievementName
            });
            const status = JSON.parse(response);
            if (status.error) {
                logEvent(`[Achievement Unlocker] Failed to unlock ${achievementName} for ${appName} (${appId})`);
                return true;
            } else {
                logEvent(`[Achievement Unlocker] Unlocked ${achievementName} for ${appName} (${appId})`);
                return false;
            }
        } else {
            logEvent('[Error] [Achievement Unlocker] Steam is not running');
            return { error: 'Steam is not running' };
        }
    } catch (error) {
        console.error('Error in unlockAchievement util: ', error);
        logEvent(`[Error] in (unlockAchievement) util: ${error}`);
    }
}

// Lock an achievement for a game
export async function lockAchievement(appId, achievementName, appName) {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            const response = await invoke('lock_achievement', {
                filePath: await getFilePath(),
                appId: appId.toString(),
                achievementId: achievementName
            });
            const status = JSON.parse(response);
            if (status.error) {
                logEvent(`[Achievement Unlocker] Failed to lock ${achievementName} for ${appName} (${appId})`);
                return true;
            } else {
                logEvent(`[Achievement Unlocker] Locked ${achievementName} for ${appName} (${appId})`);
                return false;
            }
        } else {
            logEvent('[Error] [Achievement Unlocker] Steam is not running');
            return { error: 'Steam is not running' };
        }
    } catch (error) {
        console.error('Error in lockAchievement util: ', error);
        logEvent(`[Error] in (lockAchievement) util: ${error}`);
    }
}

// Update a statistic for a game
export async function updateStat(appId, statName, newValue, appName) {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            const response = await invoke('update_stats', {
                filePath: await getFilePath(),
                appId: appId.toString(),
                statName: statName,
                newValue: newValue
            });
            const status = JSON.parse(response);
            if (status.error) {
                logEvent(`[Statistic Update] Failed to update ${statName} to ${newValue} for ${appName}`);
                return true;
            } else {
                logEvent(`[Statistic Update] Updated ${statName} to ${newValue} for ${appName}`);
                return false;
            }
        } else {
            logEvent('[Error] [Statistic Update] Steam is not running');
            return { error: 'Steam is not running' };
        }
    } catch (error) {
        console.error('Error in updateStat util: ', error);
        logEvent(`[Error] in (updateStat) util: ${error}`);
        return { error: error };
    }
}

// Check remaining card drops for a game
export async function checkDrops(steamId, appId, sid, sls) {
    try {
        const res = await invoke('get_drops_remaining', { sid: sid, sls: sls, steamId: steamId, appId: appId.toString() });
        if (res && res.remaining) {
            return res.remaining;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error in checkDrops util: ', error);
        logEvent(`[Error] in (checkDrops) util: ${error}`);
    }
}

// Get all games with remaining card drops
export async function getAllGamesWithDrops(steamId, sid, sls) {
    try {
        const res = await invoke('get_games_with_drops', { sid: sid, sls: sls, steamId: steamId });
        if (res.gamesWithDrops && res.gamesWithDrops.length > 0) {
            return res.gamesWithDrops;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in getAllGamesWithDrops util: ', error);
        logEvent(`[Error] in (getAllGamesWithDrops) util: ${error}`);
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

// Update MongoDB statistics with debounce
export const updateMongoStats = debounce(async (stat) => {
    try {
        if (stat === 'launched') {
            await axios.post(
                process.env.NEXT_PUBLIC_API_BASE + 'statistics',
                { type: 'launched' },
                { headers: { 'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_API_KEY, }, }
            );
        } else if (stat === 'idle') {
            await axios.post(
                process.env.NEXT_PUBLIC_API_BASE + 'statistics',
                { type: 'idle' },
                { headers: { 'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_API_KEY, }, }
            );
            idleCounter = 0;
        } else if (stat === 'achievement') {
            await axios.post(
                process.env.NEXT_PUBLIC_API_BASE + 'statistics',
                { type: 'achievement' },
                { headers: { 'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_API_KEY, }, }
            );
            achievementCounter = 0;
        }
    } catch (error) {
        console.error('Error in updateMongoStats util: ', error);
        logEvent(`[Error] in (updateMongoStats) util: ${error}`);
    }
}, 5000);

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
                }, 60000 * 3);
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
            sendNotification({
                title: title,
                body: body,
            });
        }
    } catch (error) {
        console.error('Error in (sendNativeNotification):', error);
        logEvent(`[Error] in (sendNativeNotification): ${error}`);
    }
}

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

// Convert minutes to hours in a compact format
export function minutesToHoursCompact(number) {
    const durationInMinutes = number;
    const duration = moment.duration(durationInMinutes, 'minutes');
    const hours = Math.floor(duration.asHours());
    return hours;
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