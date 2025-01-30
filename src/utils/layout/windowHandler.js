import { checkUpdate } from '@tauri-apps/api/updater';
import { invoke } from '@tauri-apps/api/tauri';

import { Time } from '@internationalized/date';
import { toast } from 'react-toastify';

import { fetchFreeGames, fetchLatest, logEvent, preserveKeysAndClear, sendNativeNotification, startIdler } from '@/src/utils/utils';
import UpdateToast from '@/src/components/updates/UpdateToast';

// Check for updates and handle the Tauri update process
export const checkForUpdates = async (setUpdateManifest, setInitUpdate) => {
    try {
        const { shouldUpdate, manifest } = await checkUpdate();
        const latest = await fetchLatest();
        if (shouldUpdate) {
            setUpdateManifest(manifest);
            if (latest?.major) {
                preserveKeysAndClear();
                return setInitUpdate(true);
            }
            toast(<UpdateToast updateManifest={manifest} setInitUpdate={setInitUpdate} />, { autoClose: false });
        }
    } catch (error) {
        toast.error(`Error in (checkForUpdates): ${error?.message || error}`);
        console.error('Error in (checkForUpdates):', error);
        logEvent(`[Error] in (checkForUpdates): ${error}`);
    }
};

// Show changelog modal if SGI was updated
export const changelogModal = (setShowChangelogModal) => {
    try {
        const hasUpdated = localStorage.getItem('hasUpdated');
        if (hasUpdated === 'true') {
            setShowChangelogModal(true);
            localStorage.setItem('hasUpdated', false);
        }
    } catch (error) {
        toast.error(`Error in (changelogModal): ${error?.message || error}`);
        console.error('Error in (changelogModal):', error);
        logEvent(`[Error] in (changelogModal): ${error}`);
    }
};

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
        toast.error(`Error creating default settings: ${error?.message || error}`);
        console.error('Error creating default settings:', error);
        logEvent(`[Error] creating default settings: ${error}`);
    }
};

// Check for free games and handle notifications
export const checkForFreeGames = async (setFreeGamesList, setShowFreeGamesTab) => {
    try {
        const lastNotifiedTimestamp = localStorage.getItem('lastNotifiedTimestamp');
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const { freeGameNotifications } = settings?.general || {};
        const freeGamesList = await fetchFreeGames();

        const inOneDay = new Date();
        inOneDay.setHours(inOneDay.getHours() + 24);

        if (freeGamesList.games.length > 0) {
            setFreeGamesList(freeGamesList.games);
            setShowFreeGamesTab(true);

            if (freeGameNotifications && (!lastNotifiedTimestamp || Date.now() > parseInt(lastNotifiedTimestamp))) {
                sendNativeNotification('Free Games Available!', 'Check the sidebar for the 🎁 icon to get your free games');
                localStorage.setItem('lastNotifiedTimestamp', inOneDay.valueOf());
            }
        } else {
            setFreeGamesList([]);
            setShowFreeGamesTab(false);
        }
    } catch (error) {
        toast.error(`Error in (checkForFreeGames): ${error?.message || error}`);
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
                await startIdler(game.appid, game.name, false, true);
            }
        }
    } catch (error) {
        toast.error(`Error in (startAutoIdleGames): ${error?.message || error}`);
        console.error('Error in (startAutoIdleGames):', error);
        logEvent(`[Error] in (startAutoIdleGames): ${error}`);
    }
};
