import { invoke } from '@tauri-apps/api/core';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { useEffect, useState, useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast, t } from '@/utils/toasts';

export const useGeneralSettings = () => {
    const { userSettings } = useContext(UserContext);
    const [startupState, setStartupState] = useState(null);
    const [keyValue, setKeyValue] = useState('');
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        // Check the current state of auto start
        const checkStartupState = async () => {
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
export const handleRunAtStartupChange = async (setStartupState) => {
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
export const handleKeySave = async (steamId, keyValue, setHasKey, setUserSettings) => {
    try {
        if (keyValue.length > 0) {
            const validate = await invoke('validate_steam_api_key', { steamId, apiKey: keyValue });
            if (validate.response) {
                const response = await invoke('update_user_settings', {
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
export const handleClear = async (steamId, setKeyValue, setHasKey, setUserSettings) => {
    try {
        const response = await invoke('update_user_settings', {
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