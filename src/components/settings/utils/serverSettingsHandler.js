import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';

export const getStoredServerSettings = async (setHasServerSettings, setPortValue) => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const serverSettings = settings?.serverSettings;

        if (serverSettings && serverSettings?.port) {
            setHasServerSettings(true);
            setPortValue(serverSettings?.port);
        }
    } catch (error) {
        toast.error(`Error in (getStoredServerSettings): ${error?.message || error}`);
        console.error('Error in (getStoredServerSettings):', error);
        logEvent(`[Error] in (getStoredServerSettings): ${error}`);
    }
};

export const handleSave = async (portValue, setHasServerSettings) => {
    if (portValue.length > 0) {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        settings.serverSettings.port = portValue;
        console.log(settings);
        localStorage.setItem('settings', JSON.stringify(settings));
        setHasServerSettings(true);
        toast.success(`[Mobile Server] Port saved as ${portValue}`);
        logEvent(`[Settings - Mobile Server] Port saved as ${portValue}`);
    }
};

export const handleClear = async (setHasServerSettings, setPortValue) => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const serverSettings = settings?.serverSettings;
        serverSettings.port = '';
        localStorage.setItem('settings', JSON.stringify(settings));
        setPortValue('');
        setHasServerSettings(false);
        toast.success('[Mobile Server] Cleared port');
        logEvent('[Settings - Mobile Server] Cleared port');
    } catch (error) {
        toast.error(`Error in (handleClear): ${error?.message || error}`);
        console.error('Error in (handleClear):', error);
        logEvent(`[Error] in (handleClear): ${error}`);
    }
};

export const handleCheckboxChange = (e, localSettings, setLocalSettings, setSettings) => {
    try {
        const { name, checked } = e.target;
        const updatedSettings = {
            ...localSettings,
            serverSettings: {
                ...localSettings.serverSettings,
                [name]: checked
            }
        };
        const checkboxNames = Object.keys(updatedSettings.serverSettings);
        if (checked) {
            const otherCheckboxName = checkboxNames
                .filter(checkbox => checkbox !== 'enabled')
                .find(checkbox => checkbox !== name);
            updatedSettings.serverSettings[otherCheckboxName] = false;
        } else {
            const otherCheckboxName = checkboxNames
                .filter(checkbox => checkbox !== 'enabled')
                .find(checkbox => checkbox !== name);
            if (!updatedSettings.serverSettings[otherCheckboxName]) {
                updatedSettings.serverSettings[name] = true;
            }
        }
        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        updateSettings(updatedSettings, setLocalSettings, setSettings);
        logEvent(`[Settings - Card Farming] Changed '${name}' to '${updatedSettings.serverSettings[name]}'`);
    } catch (error) {
        toast.error(`Error in (handleCheckboxChange): ${error?.message || error}`);
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
    }
};

export const handleEnableChange = (e, localSettings, setLocalSettings, setSettings) => {
    try {
        const { name, checked } = e.target;
        if (localSettings && localSettings.serverSettings) {
            const updatedSettings = {
                ...localSettings,
                serverSettings: {
                    ...localSettings.serverSettings,
                    [name]: checked
                }
            };
            updateSettings(updatedSettings, setLocalSettings, setSettings);
            logEvent(`[Settings - Mobile Server] Changed '${name}' to '${checked}'`);
        }
    } catch (error) {
        toast.error(`Error in (handleEnableChange): ${error?.message || error}`);
        console.error('Error in (handleEnableChange):', error);
        logEvent(`[Error] in (handleEnableChange): ${error}`);
    }
};

export const updateSettings = (newSettings, setLocalSettings, setSettings) => {
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