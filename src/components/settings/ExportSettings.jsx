import { Button } from '@heroui/react';
import { arch, version, locale } from '@tauri-apps/plugin-os';
import { useTranslation } from 'react-i18next';

import { getAppVersion } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export default function ExportSettings() {
    const { t } = useTranslation();

    const exportSettings = async () => {
        const allSettings = {};
        const system = {};

        // System
        const appVersion = await getAppVersion();
        allSettings['version'] = appVersion;

        const osVersion = version();
        const cpuArch = arch();

        let winVersion = 'Windows';

        const buildMatch = osVersion.match(/^10\.0\.(\d+)$/);
        if (buildMatch && buildMatch[1]) {
            const buildNumber = parseInt(buildMatch[1], 10);
            winVersion = buildNumber >= 22000 ? 'Windows 11' : 'Windows 10';
        }

        const is64Bit = cpuArch === 'x86_64';
        system['version'] = `${winVersion} ${is64Bit ? '64-bit' : '32-bit'} (${osVersion})`;
        system['locale'] = await locale();

        allSettings['system'] = system;

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