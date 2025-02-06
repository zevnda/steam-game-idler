import { useContext } from 'react';
import { useDisclosure } from '@heroui/react';

import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';

import { AppContext } from '@/src/components/layout/AppContext';
import { logEvent } from '@/src/utils/utils';

export default function useSideBar(activePage, setActivePage) {
    const { userSummary, setUserSummary, setCurrentTab, setGameQueryValue, setAchievementQueryValue } = useContext(AppContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const openConfirmation = () => {
        onOpen();
    };

    const handleLogout = async (onClose) => {
        try {
            onClose();
            const settings = JSON.parse(localStorage.getItem('settings')) || {};
            const { clearData } = settings?.general || {};
            setUserSummary(null);
            await invoke('delete_games_list_files');
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
        localStorage.removeItem('gameSettings');
        localStorage.removeItem('steamCookies');
        localStorage.removeItem('cardFarmingUser');
        localStorage.removeItem('chatUsername');
        localStorage.removeItem('chatToken');
        if (clearData) {
            localStorage.removeItem('favoritesListCache');
            localStorage.removeItem('cardFarmingListCache');
            localStorage.removeItem('achievementUnlockerListCache');
            localStorage.removeItem('autoIdleListCache');
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
