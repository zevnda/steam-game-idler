import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { getAppVersion, logEvent } from '@/utils/tasks';
import { showDangerToast, t } from '@/utils/toasts';

export default function useSettings() {
    const [version, setVersion] = useState('v0.0.0');
    const [refreshKey, setRefreshKey] = useState(0);

    // Get the app version
    useEffect(() => {
        const getAndSetVersion = async () => {
            const version = await getAppVersion();
            setVersion(version);
        };
        getAndSetVersion();
    }, []);

    return { version, refreshKey, setRefreshKey };
}

export const handleCheckboxChange = async (e, key, steamId, setUserSettings) => {
    try {
        const { name, checked } = e.target;

        const response = await invoke('update_user_settings', { steamId, key: `${key}.${name}`, value: checked });
        const updatedSettings = response.settings;

        if (key === 'cardFarming') {
            // Add radio-button-like behavior for mutually exclusive options
            // Only one of the card farming options can be active at a time
            const checkboxNames = Object.keys(updatedSettings.cardFarming);
            if (checked) {
                // If this checkbox is checked, uncheck the other one
                const otherCheckboxName = checkboxNames.filter(c => c !== 'credentials').find(c => c !== name);

                const response = await invoke('update_user_settings', { steamId, key: `cardFarming.${otherCheckboxName}`, value: false });
                setUserSettings(response.settings);
            } else {
                // Don't allow both checkboxes to be unchecked - keep one enabled
                const otherCheckboxName = checkboxNames.filter(c => c !== 'credentials').find(c => c !== name);
                if (!response.settings.cardFarming[otherCheckboxName]) {
                    const response = await invoke('update_user_settings', { steamId, key: `cardFarming.${otherCheckboxName}`, value: true });
                    setUserSettings(response.settings);
                }
            }
        } else {
            setUserSettings(response.settings);
        }

        logEvent(`[Settings - ${key}] Changed '${name}' to '${checked}'`);
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
    }
};