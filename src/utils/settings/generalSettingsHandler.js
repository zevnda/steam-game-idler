import { enable, isEnabled, disable } from 'tauri-plugin-autostart-api';
import { toast } from 'react-toastify';
import { logEvent } from '@/utils/utils';

export const initializeSettings = (settings, setLocalSettings) => {
    if (settings && settings.general) {
        setLocalSettings(settings);
    }
};

export const checkStartupState = async (setStartupState) => {
    const isEnabledState = await isEnabled();
    setStartupState(isEnabledState);
};

export const loadApiKey = (setHasKey, setKeyValue) => {
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey && apiKey.length > 0) {
        setHasKey(true);
        setKeyValue(apiKey);
    }
};

export const handleCheckboxChange = (e, localSettings, setLocalSettings, setSettings) => {
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
        toast.error(`Error in (handleCheckboxChange): ${error?.message || error}`);
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
    }
};

const updateSettings = (newSettings, setLocalSettings, setSettings) => {
    setLocalSettings(newSettings);
    setSettings(newSettings);
    try {
        localStorage.setItem('settings', JSON.stringify(newSettings));
    } catch (error) {
        toast.error(`Error in (updateSettings): ${error?.message || error}`);
        console.error('Error in (updateSettings):', error);
        logEvent(`[Error] in (updateSettings): ${error}`);
    }
};

export const handleRunAtStartupChange = async (startupState, setStartupState) => {
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
            toast.success('[General] Steam web API key added');
            logEvent('[Settings - General] Steam web API key added');
        }
    } catch (error) {
        toast.error(`Error in (handleKeySave): ${error?.message || error}`);
        console.error('Error in (handleKeySave):', error);
        logEvent(`[Error] in (handleKeySave): ${error}`);
    }
};

export const handleClear = async (setKeyValue, setHasKey) => {
    try {
        localStorage.removeItem('apiKey');
        setKeyValue('');
        setHasKey(false);
        toast.success('[General] Steam web API key cleared');
        logEvent('[Settings - General] Steam web API key cleared');
    } catch (error) {
        toast.error(`Error in (handleClear): ${error?.message || error}`);
        console.error('Error in (handleClear):', error);
        logEvent(`[Error] in (handleClear): ${error}`);
    }
};
