import { useCallback, useContext, useEffect } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { UpdateContext } from '@/components/contexts/UpdateContext';
import { AppContext } from '@/components/contexts/AppContext';
import { defaultSettings, checkForFreeGames, startAutoIdleGames } from '@/utils/layout/windowHandler';

import { check } from '@tauri-apps/plugin-updater';

export default function useWindow() {
    const { setShowFreeGamesTab } = useContext(AppContext);
    const { setUpdateAvailable, setShowChangelog } = useContext(UpdateContext);
    const { setUserSummary, setFreeGamesList } = useContext(UserContext);

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
