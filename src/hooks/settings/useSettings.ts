import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { InvokeSettings, UserSettings } from '@/types';
import { getAppVersion, logEvent } from '@/utils/tasks';
import { showDangerToast, t } from '@/utils/toasts';

interface SettingsHook {
    version: string;
    refreshKey: number;
    setRefreshKey: Dispatch<SetStateAction<number>>;
}

export default function useSettings(): SettingsHook {
    const [version, setVersion] = useState('0.0.0');
    const [refreshKey, setRefreshKey] = useState(0);

    // Get the app version
    useEffect(() => {
        const getAndSetVersion = async (): Promise<void> => {
            const version = await getAppVersion();
            setVersion(version ? version : '0.0.0');
        };
        getAndSetVersion();
    }, []);

    return { version, refreshKey, setRefreshKey };
}

interface CheckboxEvent {
    target: {
        name: string;
        checked: boolean;
    };
}

export const handleCheckboxChange = async (
    e: CheckboxEvent,
    key: keyof UserSettings,
    steamId: string | undefined,
    setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
    try {
        const { name, checked } = e.target;

        const response = await invoke<InvokeSettings>('update_user_settings', {
            steamId,
            key: `${key}.${name}`,
            value: checked
        });
        const updatedSettings = response.settings;

        if (key === 'cardFarming') {
            // Add radio-button-like behavior for mutually exclusive options
            // Only one of the card farming options can be active at a time
            const checkboxNames = Object.keys(updatedSettings.cardFarming);
            if (checked) {
                // If this checkbox is checked, uncheck the other one
                const otherCheckboxName = checkboxNames.filter(c => c !== 'credentials').find(c => c !== name);

                const response = await invoke<InvokeSettings>('update_user_settings', {
                    steamId,
                    key: `cardFarming.${otherCheckboxName}`,
                    value: false
                });
                setUserSettings(response.settings);
            } else {
                // Don't allow both checkboxes to be unchecked - keep one enabled
                const otherCheckboxName = checkboxNames
                    .filter(c => c !== 'credentials')
                    .find(c => c !== name);

                if (otherCheckboxName && !response.settings.cardFarming[otherCheckboxName as keyof typeof response.settings.cardFarming]) {
                    const response = await invoke<InvokeSettings>('update_user_settings', { steamId, key: `cardFarming.${otherCheckboxName}`, value: true });
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