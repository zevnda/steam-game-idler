import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';

import { getAppVersion } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export default function ExportSettings() {
    const { t } = useTranslation();

    const exportSettings = async () => {
        const allSettings = {};

        const version = await getAppVersion();
        allSettings['version'] = version;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
                key === 'userSummary' ||
                key === 'steamCookies' ||
                key === 'apiKey' ||
                key === 'cachedNotifications' ||
                key === 'seenNotifications' ||
                key === 'ally-supports-cache'
            ) continue;
            const value = localStorage.getItem(key);

            if (value && (value.startsWith('{') || value.startsWith('['))) {
                try {
                    allSettings[key] = JSON.parse(value);
                } catch (error) {
                    console.error(`Error parsing JSON for key "${key}":`, error);
                    allSettings[key] = value;
                }
            } else {
                allSettings[key] = value;
            }
        }
        const allSettingsString = JSON.stringify(allSettings, null, 2);
        navigator.clipboard.writeText(allSettingsString).then(() => {
            showSuccessToast(t('toast.exportData.success'));
        }).catch(() => {
            showDangerToast(t('toast.exportData.error'));
        });
    };

    return (
        <Button
            size='sm'
            className='font-semibold rounded-lg bg-dynamic text-button'
            onPress={exportSettings}
        >
            {t('settings.exportData')}
        </Button>
    );
}