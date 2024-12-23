import { useCallback, useContext, useEffect, useState } from 'react';
import { checkForUpdates, changelogModal, defaultSettings, checkForFreeGames, startAutoIdleGames } from '../utils/windowHandler';
import { AppContext } from '../components/AppContext';

export default function useWindow() {
    const {
        setUserSummary,
        setShowFreeGamesTab,
        setFreeGamesList
    } = useContext(AppContext);
    const [updateManifest, setUpdateManifest] = useState(null);
    const [initUpdate, setInitUpdate] = useState(false);
    const [showChangelogModal, setShowChangelogModal] = useState(false);

    const freeGamesCheck = useCallback(() => {
        checkForFreeGames(setFreeGamesList, setShowFreeGamesTab);
    }, []);

    useEffect(() => {
        checkForUpdates(setUpdateManifest, setInitUpdate);
        changelogModal(setShowChangelogModal);
        defaultSettings(setUserSummary);
        startAutoIdleGames();

        const intervalId = setInterval(freeGamesCheck, 60000 * 60);
        freeGamesCheck();
        return () => clearInterval(intervalId);
    }, [freeGamesCheck]);

    return {
        updateManifest,
        initUpdate,
        setInitUpdate,
        setUpdateManifest,
        showChangelogModal,
        setShowChangelogModal
    };
}
