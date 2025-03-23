import { useDisclosure } from '@heroui/react';

import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export default function useResetSettings() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Reset settings to default
    const handleResetSettings = (onClose, setSettings, setRefreshKey) => {
        try {
            localStorage.removeItem('settings');
            localStorage.removeItem('gameSettings');
            localStorage.removeItem('steamCookies');
            setSettings(null);
            setRefreshKey(prevKey => prevKey + 1);
            showSuccessToast('Settings have been reset to default');
            logEvent('[Settings] Reset to default');
            onClose();
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleResetSettings):', error);
            logEvent(`[Error] in (handleResetSettings): ${error}`);
        }
    };

    return { handleResetSettings, isOpen, onOpen, onOpenChange };
};