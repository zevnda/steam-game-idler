import { useCallback, useContext, useEffect } from 'react';
import { AppContext } from '@/components/layout/AppContext';
import { defaultSettings, checkForFreeGames, startAutoIdleGames } from '@/utils/layout/windowHandler';

import { check } from '@tauri-apps/plugin-updater';

export default function useWindow() {
    const { setUpdateAvailable, setShowChangelog, setUserSummary, setShowFreeGamesTab, setFreeGamesList } = useContext(AppContext);

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const update = await check();
                if (update?.available) {
                    setUpdateAvailable(true);
                }
            } catch (error) {
                console.error('Error in (checkForUpdates):', error);
            }
        };

        checkForUpdates();
    }, [setUpdateAvailable]);

    useEffect(() => {
        const hasUpdated = localStorage.getItem('hasUpdated');
        if (hasUpdated) {
            localStorage.removeItem('hasUpdated');
            setShowChangelog(true);
        }
    }, []);

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
