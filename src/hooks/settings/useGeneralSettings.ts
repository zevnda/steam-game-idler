import { invoke } from '@tauri-apps/api/core';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useUserContext } from '@/components/contexts/UserContext';
import type { InvokeSettings, InvokeValidateKey } from '@/types/invoke';
import type { UserSettings } from '@/types/settings';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast, t } from '@/utils/toasts';

interface GeneralSettingsHook {
    startupState: boolean | null;
    setStartupState: Dispatch<SetStateAction<boolean | null>>;
    keyValue: string;
    setKeyValue: Dispatch<SetStateAction<string>>;
    hasKey: boolean;
    setHasKey: Dispatch<SetStateAction<boolean>>;
}

export const useGeneralSettings = (): GeneralSettingsHook => {
    const { userSettings } = useUserContext();
    const [startupState, setStartupState] = useState<boolean | null>(null);
    const [keyValue, setKeyValue] = useState('');
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        // Check the current state of auto start
        const checkStartupState = async (): Promise<void> => {
            const isEnabledState = await isEnabled();
            setStartupState(isEnabledState);
        };
        checkStartupState();
    }, []);

    useEffect(() => {
        // Load Steam web API key from localStorage
        const apiKey = userSettings.general.apiKey;
        if (apiKey && apiKey.length > 0) {
            setHasKey(true);
            setKeyValue(apiKey);
        }
    }, [userSettings.general.apiKey]);

    return {
        startupState,
        setStartupState,
        keyValue,
        setKeyValue,
        hasKey,
        setHasKey
    };
};

// Toggle app auto start using tauri plugin
export const handleRunAtStartupChange = async (
    setStartupState: Dispatch<SetStateAction<boolean | null>>
): Promise<void> => {
    try {
        const isEnabledState = await isEnabled();
        if (isEnabledState) {
            await disable();
        } else {
            await enable();
        }
        setStartupState(!isEnabledState);
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleRunAtStartupChange):', error);
        logEvent(`[Error] in (handleRunAtStartupChange): ${error}`);
    }
};

// Saves Steam web API key to localStorage
export const handleKeySave = async (
    steamId: string | undefined,
    keyValue: string,
    setHasKey: Dispatch<SetStateAction<boolean>>,
    setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
    try {
        if (keyValue.length > 0) {
            const validate = await invoke<InvokeValidateKey>('validate_steam_api_key', {
                steamId, apiKey: keyValue
            });

            if (validate.response) {
                const response = await invoke<InvokeSettings>('update_user_settings', {
                    steamId,
                    key: 'general.apiKey',
                    value: keyValue
                });
                setUserSettings(response.settings);

                setHasKey(true);

                showSuccessToast(t('toast.apiKey.save'));
                logEvent('[Settings - General] Steam web API key added');
            } else {
                showDangerToast(t('toast.apiKey.error'));
            }
        }
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleKeySave):', error);
        logEvent(`[Error] in (handleKeySave): ${error}`);
    }
};

// Removes Steam API key from localStorage and resets state
export const handleClear = async (
    steamId: string | undefined,
    setKeyValue: Dispatch<SetStateAction<string>>,
    setHasKey: Dispatch<SetStateAction<boolean>>,
    setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
    try {
        const response = await invoke<InvokeSettings>('update_user_settings', {
            steamId,
            key: 'general.apiKey',
            value: null
        });
        setUserSettings(response.settings);
        setKeyValue('');
        setHasKey(false);
        showSuccessToast(t('toast.apiKey.clear'));
        logEvent('[Settings - General] Steam web API key cleared');
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleClear):', error);
        logEvent(`[Error] in (handleClear): ${error}`);
    }
};