import { useCallback, useEffect, useState } from 'react';
import { checkForUpdates, changelogModal, defaultSettings, checkForFreeGames, startAutoIdleGames } from '../utils/windowHandler';

export default function useWindow() {
    const [userSummary, setUserSummary] = useState(null);
    const [updateManifest, setUpdateManifest] = useState(null);
    const [initUpdate, setInitUpdate] = useState(false);
    const [showFreeGamesTab, setShowFreeGamesTab] = useState(false);
    const [freeGamesList, setFreeGamesList] = useState([]);
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
        userSummary,
        setUserSummary,
        updateManifest,
        initUpdate,
        setInitUpdate,
        setUpdateManifest,
        showFreeGamesTab,
        freeGamesList,
        showChangelogModal,
        setShowChangelogModal
    };
}
