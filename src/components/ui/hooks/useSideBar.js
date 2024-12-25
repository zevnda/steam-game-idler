import { useDisclosure } from '@nextui-org/react';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';
import { AppContext } from '../../layout/components/AppContext';
import { useContext } from 'react';

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

        localStorage.removeItem('userSummary');
        localStorage.removeItem('apiKey');
        if (clearData) {
            localStorage.removeItem('steamCookies');
            localStorage.removeItem('cardFarmingUser');
            localStorage.removeItem('favorites');
            localStorage.removeItem('cardFarming');
            localStorage.removeItem('achievementUnlocker');
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
