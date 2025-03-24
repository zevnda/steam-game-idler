import { useDisclosure } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { NavigationContext } from '@/components/contexts/NavigationContext';
import { SearchContext } from '@/components/contexts/SearchContext';
import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast } from '@/utils/toasts';

export default function useSideBar(activePage, setActivePage) {
    const { t } = useTranslation();
    const { setGameQueryValue, setAchievementQueryValue } = useContext(SearchContext);
    const { setCurrentTab } = useContext(NavigationContext);
    const { userSummary, setUserSummary } = useContext(UserContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const openConfirmation = () => {
        onOpen();
    };

    // Handle logging out
    const handleLogout = async (onClose) => {
        try {
            onClose();
            setUserSummary(null);
            clearLocalStorageData();
            await invoke('kill_all_steamutil_processes');
            logEvent(`[System] Logged out of ${userSummary.personaName}`);
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleLogout):', error);
            logEvent(`[Error] in (handleLogout): ${error}`);
        }
    };

    // Clear local storage data and reset states on logout
    const clearLocalStorageData = async () => {
        try {
            setActivePage('');
            setCurrentTab(null);
            setGameQueryValue('');
            setAchievementQueryValue('');

            localStorage.removeItem('sortStyle');
            localStorage.removeItem('userSummary');
            localStorage.removeItem('gameSettings');
            localStorage.removeItem('steamCookies');
            localStorage.removeItem('cardFarmingUser');
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (clearLocalStorageData):', error);
            logEvent(`[Error] in (clearLocalStorageData): ${error}`);
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
