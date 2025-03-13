import { useCallback, useContext, useEffect } from 'react';
import { useTheme } from 'next-themes';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { UpdateContext } from '@/components/contexts/UpdateContext';
import { defaultSettings, checkForFreeGames, startAutoIdleGames } from '@/utils/layout/windowHandler';

import { check } from '@tauri-apps/plugin-updater';

export default function useWindow() {
    const { theme } = useTheme();
    const { setIsDarkMode, setShowFreeGamesTab } = useContext(StateContext);
    const { setUpdateAvailable, setShowChangelog } = useContext(UpdateContext);
    const { setUserSummary, setFreeGamesList } = useContext(UserContext);

    useEffect(() => {
        const darkThemes = ['dark', 'midnight', 'amethyst', 'emerald', 'cherry', 'cosmic', 'mint', 'arctic', 'nightshade'];
        setIsDarkMode(darkThemes.includes(theme));
    }, [theme, setIsDarkMode]);

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
    }, [setShowChangelog]);

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
