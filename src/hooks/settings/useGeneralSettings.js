import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { useEffect, useState } from 'react';

import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export const useGeneralSettings = (settings, setLocalSettings) => {
    const [startupState, setStartupState] = useState(null);
    const [keyValue, setKeyValue] = useState('');
    const [hasKey, setHasKey] = useState(false);

    // Sync local settings with global settings when they change
    useEffect(() => {
        if (setLocalSettings && settings && settings.general) {
            setLocalSettings(settings);
        }
    }, [settings, setLocalSettings]);

    // Check the current state of auto start
    useEffect(() => {
        checkStartupState(setStartupState);
    }, []);

    // Load Steam web API key from localStorage
    useEffect(() => {
        loadApiKey(setHasKey, setKeyValue);
    }, []);

    return {
        startupState,
        setStartupState,
        keyValue,
        setKeyValue,
        hasKey,
        setHasKey
    };
};

// Check the current state of auto start
const checkStartupState = async (setStartupState) => {
    const isEnabledState = await isEnabled();
    setStartupState(isEnabledState);
};

// Load Steam web API key from localStorage
const loadApiKey = (setHasKey, setKeyValue) => {
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey && apiKey.length > 0) {
        setHasKey(true);
        setKeyValue(apiKey);
    }
};

// Helper function to persist settings to localStorage and update both state values
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

// Handle toggling of checkboxes
export const generalCheckboxChange = (e, localSettings, setLocalSettings, setSettings) => {
    try {
        const { name, checked } = e.target;
        if (localSettings && localSettings.general) {
            // Create a new settings object with the updated checkbox value
            // This avoids directly modifying the existing state object
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

// Toggle app auto start using tauri plugin
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

// Saves Steam web API key to localStorage
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

// Removes Steam API key from localStorage and resets state
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