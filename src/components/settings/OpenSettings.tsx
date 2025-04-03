import { Button } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast } from '@/utils/toasts';

export default function OpenSettings(): ReactElement {
    const { t } = useTranslation();
    const { userSummary } = useUserContext();

    // Open the log file in file explorer
    const handleOpenSettingsFile = async (): Promise<void> => {
        try {
            const filePath = `cache\\${userSummary?.steamId}\\settings.json`;
            await invoke('open_file_explorer', { path: filePath });
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleOpenSettingsFile):', error);
            logEvent(`[Error] in (handleOpenSettingsFile): ${error}`);
        }
    };

    return (
        <Button
            size='sm'
            className='font-semibold rounded-lg bg-dynamic text-button'
            onPress={handleOpenSettingsFile}
        >
            {t('settings.openSettings')}
        </Button>
    );
}