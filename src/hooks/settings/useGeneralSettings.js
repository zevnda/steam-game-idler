import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { useEffect, useState } from 'react';

import { logEvent } from '@/utils/global/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/global/toasts';

export const useGeneralSettings = (settings, setLocalSettings) => {
    const [startupState, setStartupState] = useState(null);
    const [keyValue, setKeyValue] = useState('');
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        if (setLocalSettings && settings && settings.general) {
            setLocalSettings(settings);
        }
    }, [settings, setLocalSettings]);

    useEffect(() => {
        checkStartupState(setStartupState);
    }, []);

    useEffect(() => {
        loadApiKey(setHasKey, setKeyValue);
    }, []);

    const checkStartupState = async (setStartupState) => {
        const isEnabledState = await isEnabled();
        setStartupState(isEnabledState);
    };

    const loadApiKey = (setHasKey, setKeyValue) => {
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey && apiKey.length > 0) {
            setHasKey(true);
            setKeyValue(apiKey);
        }
    };

    return {
        startupState,
        setStartupState,
        keyValue,
        setKeyValue,
        hasKey,
        setHasKey
    };
};

const updateSettings = (newSettings, setLocalSettings, setSettings) => {
    setLocalSettings(newSettings);
    setSettings(newSettings);
    try {
        localStorage.setItem('settings', JSON.stringify(newSettings));
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (updateSettings):', error);
        logEvent(`[Error] in (updateSettings): ${error}`);
    }
};

export const generalCheckboxChange = (e, localSettings, setLocalSettings, setSettings) => {
    try {
        const { name, checked } = e.target;
        if (localSettings && localSettings.general) {
            const updatedSettings = {
                ...localSettings,
                general: {
                    ...localSettings.general,
                    [name]: checked
                }
            };
            updateSettings(updatedSettings, setLocalSettings, setSettings);
            logEvent(`[Settings - General] Changed '${name}' to '${checked}'`);
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
    }
};

export const handleRunAtStartupChange = async (setStartupState) => {
    const isEnabledState = await isEnabled();
    if (isEnabledState) {
        await disable();
    } else {
        await enable();
    }
    setStartupState(!isEnabledState);
};

export const handleKeyChange = (e, setKeyValue) => {
    setKeyValue(e.target.value);
};

export const handleKeySave = async (keyValue, setHasKey) => {
    try {
        if (keyValue.length > 0) {
            localStorage.setItem('apiKey', keyValue);
            setHasKey(true);
            showSuccessToast('Steam web API key added');
            logEvent('[Settings - General] Steam web API key added');
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleKeySave):', error);
        logEvent(`[Error] in (handleKeySave): ${error}`);
    }
};

export const handleClear = async (setKeyValue, setHasKey) => {
    try {
        localStorage.removeItem('apiKey');
        setKeyValue('');
        setHasKey(false);
        showSuccessToast('Steam web API key cleared');
        logEvent('[Settings - General] Steam web API key cleared');
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleClear):', error);
        logEvent(`[Error] in (handleClear): ${error}`);
    }
};