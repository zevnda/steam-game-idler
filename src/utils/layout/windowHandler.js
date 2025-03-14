import { addToast } from '@heroui/react';
import { Time } from '@internationalized/date';
import { invoke } from '@tauri-apps/api/core';

import { fetchFreeGames, logEvent, sendNativeNotification, startIdle } from '@/utils/utils';

// Set default settings and updates user summary
export const defaultSettings = (setUserSummary) => {
    const defaultSettings = {
        general: {
            stealthIdle: false,
            antiAway: false,
            clearData: true,
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
        const freeGamesList = await fetchFreeGames();

        // Compare the new free games with the old ones
        const oldFreeGameIds = JSON.parse(localStorage.getItem('freeGamesIds')) || [];
        const newFreeGameIds = freeGamesList.games.map(game => game.appid);

        // Show free games tab if there are any
        if (freeGamesList.games.length > 0) {
            setFreeGamesList(freeGamesList.games);
            setShowFreeGamesTab(true);

            console.log(JSON.stringify(oldFreeGameIds) !== JSON.stringify(newFreeGameIds));

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
        const autoIdleGames = (localStorage.getItem('autoIdleListCache') && JSON.parse(localStorage.getItem('autoIdleListCache'))) || [];
        const gameIds = autoIdleGames.map(game => game.appid.toString());
        const notRunningIds = await invoke('check_process_by_game_id', { ids: gameIds });
        for (const id of notRunningIds) {
            const game = autoIdleGames.find(g => g.appid.toString() === id);
            if (game) {
                await startIdle(game.appid, game.name, false, true);
            }
        }
    } catch (error) {
        addToast({ description: `Error in (startAutoIdleGames): ${error?.message || error}`, color: 'danger' });
        console.error('Error in (startAutoIdleGames):', error);
        logEvent(`[Error] in (startAutoIdleGames): ${error}`);
    }
};
