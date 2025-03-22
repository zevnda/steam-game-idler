import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { logEvent } from '@/utils/global/tasks';
import { showAccountMismatchToast, showDangerToast, showIncorrectCredentialsToast, showSuccessToast } from '@/utils/global/toasts';

export const useCardSettings = (settings, setLocalSettings) => {
    const [sidValue, setSidValue] = useState('');
    const [slsValue, setSlsValue] = useState('');
    const [smaValue, setSmaValue] = useState('');
    const [hasCookies, setHasCookies] = useState(false);
    const [cardFarmingUser, setCardFarmingUser] = useState(null);

    useEffect(() => {
        if (setLocalSettings && settings && settings.cardFarming) {
            setLocalSettings(settings);
        }
    }, [settings, setLocalSettings]);

    useEffect(() => {
        getStoredCookies(setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser);
    }, []);

    const handleSidChange = (e) => {
        setSidValue(e.target.value);
    };

    const handleSlsChange = (e) => {
        setSlsValue(e.target.value);
    };

    const handleSmaChange = (e) => {
        setSmaValue(e.target.value);
    };

    return {
        sidValue,
        slsValue,
        smaValue,
        hasCookies,
        setSidValue,
        setSlsValue,
        setSmaValue,
        setHasCookies,
        handleSidChange,
        handleSlsChange,
        handleSmaChange,
        cardFarmingUser,
        setCardFarmingUser,
    };
};

const fetchUserSummary = async (steamId, apiKey) => {
    const res = await invoke('get_user_summary', { steamId, apiKey });
    return {
        steamId: res.response.players[0].steamid,
        personaName: res.response.players[0].personaname,
        avatar: res.response.players[0].avatar.replace('.jpg', '_full.jpg')
    };
};

export const getStoredCookies = async (setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser) => {
    try {
        const steamCookies = JSON.parse(localStorage.getItem('steamCookies'));
        const cardFarmingUser = JSON.parse(localStorage.getItem('cardFarmingUser'));

        if (steamCookies && steamCookies?.sid && steamCookies?.sls) {
            setHasCookies(true);
            setSidValue(steamCookies?.sid);
            setSlsValue(steamCookies?.sls);
            setSmaValue(steamCookies?.sma);
        }
        if (cardFarmingUser) {
            setCardFarmingUser(cardFarmingUser);
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (getStoredCookies):', error);
        logEvent(`[Error] in (getStoredCookies): ${error}`);
    }
};

export const handleSave = async (sidValue, slsValue, smaValue, setHasCookies, userSummary, setCardFarmingUser) => {
    try {
        if (sidValue.length > 0 && slsValue.length > 0) {
            const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

            const res = await invoke('validate_session', { sid: sidValue, sls: slsValue, sma: smaValue, steamid: userSummary.steamId });

            if (res.user) {
                const steamId = slsValue.slice(0, 17);
                const apiKey = localStorage.getItem('apiKey');
                const cardFarmingUser = await fetchUserSummary(steamId, apiKey);

                if (cardFarmingUser.steamId !== userSummary.steamId) {
                    showAccountMismatchToast('danger');
                    return logEvent('[Error] in (handleSave) Account mismatch between Steam and SGI');
                }

                localStorage.setItem('steamCookies', JSON.stringify({ sid: sidValue, sls: slsValue, sma: smaValue }));
                setHasCookies(true);

                setCardFarmingUser(cardFarmingUser);
                localStorage.setItem('cardFarmingUser', JSON.stringify(cardFarmingUser));

                showSuccessToast(`[Card Farming] Logged in as ${res.user}`);
                logEvent(`[Settings - Card Farming] Logged in as ${res.user}`);
            } else {
                showIncorrectCredentialsToast();
                logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials');
            }
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleSave):', error);
        logEvent(`[Error] in (handleSave): ${error}`);
    }
};

export const handleClear = async (setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser) => {
    try {
        localStorage.removeItem('steamCookies');
        localStorage.removeItem('cardFarmingUser');
        setSidValue('');
        setSlsValue('');
        setSmaValue('');
        setHasCookies(false);
        setCardFarmingUser(null);
        showSuccessToast('[Card Farming] Logged out');
        logEvent('[Settings - Card Farming] Logged out');
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleClear):', error);
        logEvent(`[Error] in (handleClear): ${error}`);
    }
};

export const cardCheckboxChange = (e, localSettings, setLocalSettings, setSettings) => {
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
        showDangerToast('An error occurred. Check the logs for more information');
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
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (updateSettings):', error);
        logEvent(`[Error] in (updateSettings): ${error}`);
    }
};