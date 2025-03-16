import { addToast, useDisclosure } from '@heroui/react';
import { useContext } from 'react';

import { NavigationContext } from '@/components/contexts/NavigationContext';
import { SearchContext } from '@/components/contexts/SearchContext';
import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/utils';

export default function useSideBar(activePage, setActivePage) {
    const { setGameQueryValue, setAchievementQueryValue } = useContext(SearchContext);
    const { setCurrentTab } = useContext(NavigationContext);
    const { userSummary, setUserSummary } = useContext(UserContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const openConfirmation = () => {
        onOpen();
    };

    const handleLogout = async (onClose) => {
        try {
            onClose();
            setUserSummary(null);
            clearLocalStorageData();
            logEvent(`[System] Logged out of ${userSummary.personaName}`);
        } catch (error) {
            addToast({ description: `Error in (handleLogout): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleLogout):', error);
            logEvent(`[Error] in (handleLogout): ${error}`);
        }
    };

    const clearLocalStorageData = async () => {
        try {
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
        } catch (error) {
            addToast({ description: `Error in (clearLocalStorageData): ${error?.message || error}`, color: 'danger' });
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
