import { useContext } from 'react';
import { addToast, useDisclosure } from '@heroui/react';

import { invoke } from '@tauri-apps/api/core';

import { AppContext } from '@/components/layout/AppContext';
import { logEvent } from '@/utils/utils';

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
            addToast({ description: `Error in (handleLogout): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleLogout):', error);
            logEvent(`[Error] in (handleLogout): ${error}`);
        }
    };

    const clearLocalStorageData = (clearData) => {
        setActivePage('');
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
