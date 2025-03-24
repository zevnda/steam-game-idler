import { useDisclosure } from '@heroui/react';
import { useTranslation } from 'react-i18next';

import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export default function useResetSettings() {
    const { t } = useTranslation();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Reset settings to default
    const handleResetSettings = (onClose, setSettings, setRefreshKey) => {
        try {
            localStorage.removeItem('settings');
            localStorage.removeItem('gameSettings');
            localStorage.removeItem('steamCookies');
            setSettings(null);
            setRefreshKey(prevKey => prevKey + 1);
            showSuccessToast(t('toast.resetSettings.success'));
            logEvent('[Settings] Reset to default');
            onClose();
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleResetSettings):', error);
            logEvent(`[Error] in (handleResetSettings): ${error}`);
        }
    };

    return { handleResetSettings, isOpen, onOpen, onOpenChange };
};