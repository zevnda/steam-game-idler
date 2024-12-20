import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';

export const getStoredCookies = async (setHasCookies, setSidValue, setSlsValue, setSmaValue) => {
    try {
        const steamCookies = JSON.parse(localStorage.getItem('steamCookies'));

        if (steamCookies && steamCookies?.sid && steamCookies?.sls) {
            setHasCookies(true);
            setSidValue(steamCookies?.sid);
            setSlsValue(steamCookies?.sls);
            setSmaValue(steamCookies?.sma);
        }
    } catch (error) {
        toast.error(`Error in (validateSession): ${error?.message || error}`);
        console.error('Error in (validateSession):', error);
        logEvent(`[Error] in (validateSession): ${error}`);
    }
};

export const handleSave = async (sidValue, slsValue, smaValue, setHasCookies) => {
    try {
        if (sidValue.length > 0 && slsValue.length > 0) {
            const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

            const res = await invoke('validate_session', { sid: sidValue, sls: slsValue, sma: smaValue, steamid: userSummary.steamId });

            if (res.user) {
                localStorage.setItem('steamCookies', JSON.stringify({ sid: sidValue, sls: slsValue, sma: smaValue }));
                setHasCookies(true);
                toast.success(`[Card Farming] Logged in as ${res.user}`);
                logEvent(`[Settings - Card Farming] Logged in as ${res.user}`);
            } else {
                toast.error('[Card Farming] Incorrect card farming credentials');
                logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials');
            }
        }
    } catch (error) {
        toast.error(`Error in (handleSave): ${error?.message || error}`);
        console.error('Error in (handleSave):', error);
        logEvent(`[Error] in (handleSave): ${error}`);
    }
};

export const handleClear = async (setHasCookies, setSidValue, setSlsValue, setSmaValue) => {
    try {
        localStorage.removeItem('steamCookies');
        setSidValue('');
        setSlsValue('');
        setSmaValue('');
        setHasCookies(false);
        toast.success('[Card Farming] Logged out');
        logEvent('[Settings - Card Farming] Logged out');
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
            achievementUnlocker: {
                ...localSettings.achievementUnlocker
            },
            cardFarming: {
                ...localSettings.cardFarming,
                [name]: checked
            }
        };
        const checkboxNames = Object.keys(updatedSettings.cardFarming);
        if (checked) {
            const otherCheckboxName = checkboxNames.find(checkbox => checkbox !== name);
            updatedSettings.cardFarming[otherCheckboxName] = false;
        } else {
            const otherCheckboxName = checkboxNames.find(checkbox => checkbox !== name);
            if (!updatedSettings.cardFarming[otherCheckboxName]) {
                updatedSettings.cardFarming[name] = true;
            }
        }
        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        updateSettings(updatedSettings, setLocalSettings, setSettings);
        logEvent(`[Settings - Card Farming] Changed '${name}' to '${updatedSettings.cardFarming[name]}'`);
    } catch (error) {
        toast.error(`Error in (handleCheckboxChange): ${error?.message || error}`);
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
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
