import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useTheme } from 'next-themes';
import { useCallback, useContext, useEffect } from 'react';

import { IdleContext } from '@/components/contexts/IdleContext';
import { StateContext } from '@/components/contexts/StateContext';
import { UpdateContext } from '@/components/contexts/UpdateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/global/tasks';
import { fetchLatest, preserveKeysAndClearData } from '@/utils/global/tasks';
import { defaultSettings, checkForFreeGames, startAutoIdleGames } from '@/utils/layout/windowHandler';

export default function useWindow() {
    const { theme } = useTheme();
    const { setIdleGamesList } = useContext(IdleContext);
    const { setIsDarkMode, setShowFreeGamesTab } = useContext(StateContext);
    const { setUpdateAvailable, setShowChangelog } = useContext(UpdateContext);
    const { setUserSummary, setFreeGamesList } = useContext(UserContext);

    useEffect(() => {
        emit('ready');
    }, []);

    useEffect(() => {
        const darkThemes = ['dark', 'midnight', 'amethyst', 'emerald', 'cherry', 'cosmic', 'mint', 'arctic', 'nightshade'];
        setIsDarkMode(darkThemes.includes(theme));
    }, [theme, setIsDarkMode]);

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const update = await check();
                if (update?.available) {
                    const latest = await fetchLatest();
                    if (latest?.major) {
                        localStorage.setItem('hasUpdated', 'true');
                        await update.downloadAndInstall();
                        await preserveKeysAndClearData();
                        await invoke('kill_all_steamutil_processes');
                        await relaunch();
                    } else {
                        setUpdateAvailable(true);
                    }
                }
            } catch (error) {
                addToast({ description: 'Error checking for updates', color: 'danger' });
                console.error('Error in (checkForUpdates):', error);
                logEvent(`Error in (checkForUpdates): ${error}`);
            }
        };
        checkForUpdates();
        const intervalId = setInterval(checkForUpdates, 5000 * 60);
        return () => {
            clearInterval(intervalId);
        };
    }, [setUpdateAvailable]);

    useEffect(() => {
        const hasUpdated = localStorage.getItem('hasUpdated');
        if (hasUpdated) {
            localStorage.removeItem('hasUpdated');
            setShowChangelog(true);
        }
    }, [setShowChangelog]);

    useEffect(() => {
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
                                startTime: existingGame?.startTime || Date.now()
                            };
                        });
                    }

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
        defaultSettings(setUserSummary);
        startAutoIdleGames();

        const intervalId = setInterval(freeGamesCheck, 60000 * 60);
        freeGamesCheck();
        return () => clearInterval(intervalId);
    }, [freeGamesCheck, setUserSummary]);
}
