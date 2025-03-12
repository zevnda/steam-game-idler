import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '@/components/layout/AppContext';
import { checkForUpdates, changelogModal, defaultSettings, checkForFreeGames, startAutoIdleGames } from '@/utils/layout/windowHandler';

export default function useWindow() {
    const { setUserSummary, setShowFreeGamesTab, setFreeGamesList, setCanUpdate, setInitUpdate, showChangelogModal, setShowChangelogModal } = useContext(AppContext);
    const [updateManifest, setUpdateManifest] = useState(null);

    const freeGamesCheck = useCallback(() => {
        checkForFreeGames(setFreeGamesList, setShowFreeGamesTab);
    }, [setFreeGamesList, setShowFreeGamesTab]);

    useEffect(() => {
        checkForUpdates(setUpdateManifest, setCanUpdate, setInitUpdate);
        changelogModal(setShowChangelogModal);
        defaultSettings(setUserSummary);
        startAutoIdleGames();

        const intervalId = setInterval(freeGamesCheck, 60000 * 60);
        freeGamesCheck();
        return () => clearInterval(intervalId);
    }, [freeGamesCheck, setCanUpdate, setInitUpdate, setShowChangelogModal, setUserSummary]);

    return {
        updateManifest,
        setInitUpdate,
        setUpdateManifest,
        showChangelogModal,
        setShowChangelogModal
    };
}
