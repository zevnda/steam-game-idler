import { useContext } from 'react';
import { useDisclosure } from '@heroui/react';

import { toast } from 'react-toastify';

import { AppContext } from '@/src/components/layout/AppContext';
import { logEvent } from '@/src/utils/utils';

export default function useSideBar(activePage, setActivePage) {
    const { userSummary, setUserSummary, setCurrentTab, setGameQueryValue, setAchievementQueryValue } = useContext(AppContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const openConfirmation = () => {
        onOpen();
    };

    const handleLogout = (onClose) => {
        try {
            onClose();
            const settings = JSON.parse(localStorage.getItem('settings')) || {};
            const { clearData } = settings?.general || {};
            setUserSummary(null);
            sessionStorage.removeItem('gamesListCache');
            sessionStorage.removeItem('recentGamesCache');
            clearLocalStorageData(clearData);
            logEvent(`[System] Logged out of ${userSummary.personaName}`);
        } catch (error) {
            toast.error(`Error in (handleLogout): ${error?.message || error}`);
            console.error('Error in (handleLogout):', error);
            logEvent(`[Error] in (handleLogout): ${error}`);
        }
    };

    const clearLocalStorageData = (clearData) => {
        setActivePage('games');
        setCurrentTab(null);
        setGameQueryValue('');
        setAchievementQueryValue('');

        localStorage.removeItem('apiKey');
        localStorage.removeItem('sortStyle');
        localStorage.removeItem('userSummary');
        if (clearData) {
            localStorage.removeItem('steamCookies');
            localStorage.removeItem('cardFarmingUser');
            localStorage.removeItem('favoritesListCache');
            localStorage.removeItem('cardFarmingListCache');
            localStorage.removeItem('achievementUnlockerListCache');
            localStorage.removeItem('autoIdleListCache');
            localStorage.removeItem('gameSettings');
        }
    };

    return {
        isOpen,
        onOpenChange,
        activePage,
        setActivePage,
        openConfirmation,
        handleLogout,
    };
}
