import { addToast } from '@heroui/react';
import { Time } from '@internationalized/date';
import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

import { startIdle } from '@/utils/global/idle';
import { logEvent } from '@/utils/global/tasks';

// Set default settings and updates user summary
export const defaultSettings = (setUserSummary) => {
    const defaultSettings = {
        general: {
            antiAway: false,
            freeGameNotifications: true,
        },
        cardFarming: {
            listGames: true,
            allGames: false
        },
        achievementUnlocker: {
            idle: true,
            hidden: false,
            schedule: false,
            scheduleFrom: new Time(8, 30),
            scheduleTo: new Time(23, 0),
            interval: [30, 130],
        }
    };
    try {
        const userSummaryData = localStorage.getItem('userSummary');
        setUserSummary(JSON.parse(userSummaryData));
        let currentSettings = JSON.parse(localStorage.getItem('settings'));
        if (!currentSettings) {
            localStorage.setItem('settings', JSON.stringify(defaultSettings));
            currentSettings = JSON.parse(localStorage.getItem('settings'));
        }
    } catch (error) {
        addToast({ description: `Error creating default settings: ${error?.message || error}`, color: 'danger' });
        console.error('Error creating default settings:', error);
        logEvent(`[Error] creating default settings: ${error}`);
    }
};

// Check for free games and handle notifications
export const checkForFreeGames = async (setFreeGamesList, setShowFreeGamesTab) => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const freeGameNotifications = settings?.general?.freeGameNotifications;
        const freeGamesList = await getFreeGames();

        // Compare the new free games with the old ones
        const oldFreeGameIds = JSON.parse(localStorage.getItem('freeGamesIds')) || [];
        const newFreeGameIds = freeGamesList.games.map(game => game.appid);

        // Show free games tab if there are any
        if (freeGamesList.games.length > 0) {
            setFreeGamesList(freeGamesList.games);
            setShowFreeGamesTab(true);

            // If there are new free games, notify the user
            if (JSON.stringify(oldFreeGameIds) !== JSON.stringify(newFreeGameIds)) {
                localStorage.setItem('freeGamesIds', JSON.stringify(newFreeGameIds));
                if (freeGameNotifications) {
                    sendNativeNotification('Free Games Available!', 'Check the sidebar for the 🎁 icon to get your free games');
                }
            }
        } else {
            localStorage.setItem('freeGamesIds', JSON.stringify([]));
            setFreeGamesList([]);
            setShowFreeGamesTab(false);
        }
    } catch (error) {
        addToast({ description: `Error in (checkForFreeGames): ${error?.message || error}`, color: 'danger' });
        console.error('Error in (checkForFreeGames):', error);
        logEvent(`[Error] in (checkForFreeGames): ${error}`);
    }
};

// Starts auto idling games that are not currently running
export const startAutoIdleGames = async () => {
    try {
        const userSummary = JSON.parse(localStorage.getItem('userSummary'));
        if (userSummary && userSummary?.steamId) {
            const customLists = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'autoIdleList' });
            if (!customLists.error && customLists.list_data.length > 0) {
                const autoIdleGames = customLists.list_data;
                const gameIds = autoIdleGames.map(game => game.appid);

                const response = await invoke('get_running_processes');
                const processes = response?.processes;
                const runningIdlers = processes.map(p => p.appid);

                // Start idling games that are not running
                const gamesToIdle = gameIds.filter(id => !runningIdlers.includes(id));
                for (const appid of gamesToIdle) {
                    const game = autoIdleGames.find(g => g.appid === appid);
                    if (!runningIdlers.includes(appid)) {
                        await startIdle(game.appid, game.name, true);
                    }
                }
            }
        }
    } catch (error) {
        addToast({ description: `Error in (startAutoIdleGames): ${error?.message || error}`, color: 'danger' });
        console.error('Error in (startAutoIdleGames):', error);
        logEvent(`[Error] in (startAutoIdleGames): ${error}`);
    }
};

// Get free games
async function getFreeGames() {
    try {
        const res = await invoke('get_free_games');
        if (res) {
            return res;
        }
        return [];
    } catch (error) {
        console.error('Error in (getFreeGames):', error);
        logEvent(`[Error] in (getFreeGames): ${error}`);
        return false;
    }
}

// Send a native notification
async function sendNativeNotification(title, body) {
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