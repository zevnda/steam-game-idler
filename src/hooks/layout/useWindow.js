import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '@/src/components/layout/AppContext';
import { checkForUpdates, changelogModal, defaultSettings, checkForFreeGames, startAutoIdleGames } from '@/src/utils/layout/windowHandler';

export default function useWindow() {
    const { setUserSummary, setShowFreeGamesTab, setFreeGamesList } = useContext(AppContext);
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
