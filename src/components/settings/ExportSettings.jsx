import { Button } from '@heroui/react';

import { showDangerToast, showSuccessToast } from '@/utils/global/toasts';
import { getAppVersion } from '@/utils/settings/settingsHandler';

export default function ExportSettings() {
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
            try {
                allSettings[key] = JSON.parse(value);
            } catch (error) {
                console.error(error);
                allSettings[key] = value;
            }
        }
        const allSettingsString = JSON.stringify(allSettings, null, 2);
        navigator.clipboard.writeText(allSettingsString).then(() => {
            showSuccessToast('Data copied to clipboard');
        }).catch(() => {
            showDangerToast('Error exporting data');
        });
    };

    return (
        <Button
            size='sm'
            className='font-semibold rounded-lg bg-dynamic text-button'
            onPress={exportSettings}
        >
            Export Data
        </Button>
    );
}