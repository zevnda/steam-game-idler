import { Time } from '@internationalized/date';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useTheme } from 'next-themes';
import { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { IdleContext } from '@/components/contexts/IdleContext';
import { StateContext } from '@/components/contexts/StateContext';
import { UpdateContext } from '@/components/contexts/UpdateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { startIdle } from '@/utils/idle';
import { checkSteamStatus, logEvent, fetchLatest, preserveKeysAndClearData } from '@/utils/tasks';
import { showDangerToast, t } from '@/utils/toasts';

export default function useWindow() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { setIdleGamesList } = useContext(IdleContext);
    const { setIsDarkMode, setShowFreeGamesTab, setIsCardFarming, setIsAchievementUnlocker, setShowSteamWarning } = useContext(StateContext);
    const { setUpdateAvailable, setShowChangelog } = useContext(UpdateContext);
    const { userSummary, setUserSummary, setFreeGamesList } = useContext(UserContext);

    useEffect(() => {
        emit('ready');
    }, []);

    useEffect(() => {
        // Set dark mode based on the current theme
        const darkThemes = ['dark', 'midnight', 'amethyst', 'emerald', 'cherry', 'cosmic', 'mint', 'arctic', 'nightshade'];
        setIsDarkMode(darkThemes.includes(theme));
    }, [theme, setIsDarkMode]);

    useEffect(() => {
        // Check for updates - immediate update for major, or show notification
        const checkForUpdates = async () => {
            try {
                const update = await check();
                if (update?.available) {
                    const latest = await fetchLatest();
                    if (latest?.major) {
                        localStorage.setItem('hasUpdated', 'true');
                        await invoke('kill_all_steamutil_processes');
                        await update.downloadAndInstall();
                        await preserveKeysAndClearData();
                        await relaunch();
                    } else {
                        setUpdateAvailable(true);
                    }
                }
            } catch (error) {
                showDangerToast(t('toast.checkUpdate.error'));
                console.error('Error in (checkForUpdates):', error);
                logEvent(`Error in (checkForUpdates): ${error}`);
            }
        };
        checkForUpdates();
        const intervalId = setInterval(checkForUpdates, 5000 * 60);
        return () => {
            clearInterval(intervalId);
        };
    }, [setUpdateAvailable, t]);

    useEffect(() => {
        // Monitor if Steam client is running - stop features if Steam closes
        // and show a modal to the user
        const checkSteamStatusInt = async () => {
            try {
                const isSteamRunning = await checkSteamStatus();
                if (!isSteamRunning && userSummary) {
                    await invoke('kill_all_steamutil_processes');
                    setIsCardFarming(false);
                    setIsAchievementUnlocker(false);
                    setShowSteamWarning(true);
                }
            } catch (error) {
                console.error('Error in (checkSteamStatusInt):', error);
                logEvent(`Error in (checkSteamStatusInt): ${error}`);
            }
        };
        checkSteamStatusInt();
        const intervalId = setInterval(checkSteamStatusInt, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [userSummary, setIsAchievementUnlocker, setIsCardFarming, setShowSteamWarning]);

    useEffect(() => {
        // Show changelog after updates
        const hasUpdated = localStorage.getItem('hasUpdated');
        if (hasUpdated) {
            localStorage.removeItem('hasUpdated');
            setShowChangelog(true);
        }
    }, [setShowChangelog]);

    useEffect(() => {
        // Track games that are being idled
        const fetchRunningProcesses = async () => {
            try {
                const response = await invoke('get_running_processes');
                const processes = response?.processes;

                setIdleGamesList(prevList => {
                    if (prevList.length !== processes.length) {
                        return processes.map(process => {
                            const existingGame = prevList.find(game => game.appid === process.appid);
                            return {
                                ...process,
                                // Track start time for idle timer
                                startTime: existingGame?.startTime || Date.now()
                            };
                        });
                    }

                    // Only update if the list of games has actually changed
                    const prevMap = new Map(prevList.map(item => [item.appid, item]));
                    const newMap = new Map(processes.map(item => [item.appid, item]));

                    if (prevList.some(item => !newMap.has(item.appid)) ||
                        processes.some(item => !prevMap.has(item.appid))) {
                        return processes;
                    }

                    return prevList;
                });
            } catch (error) {
                console.error('Error fetching running processes:', error);
            }
        };

        fetchRunningProcesses();
        const intervalId = setInterval(fetchRunningProcesses, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [setIdleGamesList]);

    const freeGamesCheck = useCallback(() => {
        checkForFreeGames(setFreeGamesList, setShowFreeGamesTab);
    }, [setFreeGamesList, setShowFreeGamesTab]);

    useEffect(() => {
        // Set userSummary in defaultSettings
        defaultSettings(setUserSummary);
        // Start idling games in auto idle list
        startAutoIdleGames();
        // Check for free games
        freeGamesCheck();

        const intervalId = setInterval(freeGamesCheck, 60000 * 60);
        return () => clearInterval(intervalId);
    }, [freeGamesCheck, setUserSummary]);
}

// Set default settings and updates user summary
export const defaultSettings = (setUserSummary) => {
    // Default app settings if none exist in local storage
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
        showDangerToast(t('common.error'));
        console.error('Error creating default settings:', error);
        logEvent(`[Error] creating default settings: ${error}`);
    }
};

// Check for free games
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

            // Only notify if the list of free games has changed
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
        showDangerToast(t('common.error'));
        console.error('Error in (checkForFreeGames):', error);
        logEvent(`[Error] in (checkForFreeGames): ${error}`);
    }
};

// Start idling games in auto idle list
export const startAutoIdleGames = async () => {
    try {
        const userSummary = JSON.parse(localStorage.getItem('userSummary'));
        if (userSummary && userSummary?.steamId) {
            const customLists = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'autoIdleList' });
            if (!customLists.error && customLists.list_data.length > 0) {
                const autoIdleGames = customLists.list_data;
                const gameIds = autoIdleGames.map(game => game.appid);

                // Get currently running games to avoid starting duplicates
                const response = await invoke('get_running_processes');
                const processes = response?.processes;
                const runningIdlers = processes.map(p => p.appid);

                // Start idling games that are not already idling
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
        showDangerToast(t('common.error'));
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

        // Request permission if not granted
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }

        if (permissionGranted) {
            sendNotification({ title, body, });
        }
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (sendNativeNotification):', error);
        logEvent(`[Error] in (sendNativeNotification): ${error}`);
    }
}
