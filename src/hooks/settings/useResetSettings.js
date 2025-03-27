import { useDisclosure } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export default function useResetSettings() {
    const { t } = useTranslation();
    const { userSummary, setUserSettings } = useContext(UserContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Reset settings to default
    const handleResetSettings = async (onClose, setRefreshKey) => {
        try {
            const response = await invoke('reset_user_settings', { steamId: userSummary.steamId });
            setUserSettings(response.settings);
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