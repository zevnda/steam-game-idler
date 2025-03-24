import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { logEvent } from '@/utils/tasks';
import { showAccountMismatchToast, showDangerToast, showIncorrectCredentialsToast, showSuccessToast, t } from '@/utils/toasts';

export const useCardSettings = (settings, setLocalSettings) => {
    const [sidValue, setSidValue] = useState(''); // sessionid
    const [slsValue, setSlsValue] = useState(''); // steamLoginSecure
    const [smaValue, setSmaValue] = useState(''); // steamMachineAuth
    const [hasCookies, setHasCookies] = useState(false);
    const [cardFarmingUser, setCardFarmingUser] = useState(null);

    // Sync local settings with global settings when they change
    useEffect(() => {
        if (setLocalSettings && settings && settings.cardFarming) {
            setLocalSettings(settings);
        }
    }, [settings, setLocalSettings]);

    // Get stored cookies to set their input values
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

// Gets user summary
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
        // Get previously saved Steam cookies and cardFarming user from localStorage
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
        showDangerToast(t('common.error'));
        console.error('Error in (getStoredCookies):', error);
        logEvent(`[Error] in (getStoredCookies): ${error}`);
    }
};

export const handleSave = async (sidValue, slsValue, smaValue, setHasCookies, userSummary, setCardFarmingUser) => {
    try {
        if (sidValue.length > 0 && slsValue.length > 0) {
            const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

            // Verify steam cookies are valid 
            const res = await invoke('validate_session', { sid: sidValue, sls: slsValue, sma: smaValue, steamid: userSummary.steamId });

            if (res.user) {
                // Extract steamID from the steamLoginSecure cookie (first 17 chars)
                const steamId = slsValue.slice(0, 17);
                const apiKey = localStorage.getItem('apiKey');
                const cardFarmingUser = await fetchUserSummary(steamId, apiKey);

                // Make sure user isn't trying to farm cards with different account than they're logged in with
                if (cardFarmingUser.steamId !== userSummary.steamId) {
                    showAccountMismatchToast('danger');
                    return logEvent('[Error] in (handleSave) Account mismatch between Steam and SGI');
                }

                // Save valid cookies and update UI state
                localStorage.setItem('steamCookies', JSON.stringify({ sid: sidValue, sls: slsValue, sma: smaValue }));
                setHasCookies(true);

                // Save card farming user and update UI state
                setCardFarmingUser(cardFarmingUser);
                localStorage.setItem('cardFarmingUser', JSON.stringify(cardFarmingUser));

                showSuccessToast(t('toast.cardFarming.logIn', { user: res.user }));
                logEvent(`[Settings - Card Farming] Logged in as ${res.user}`);
            } else {
                showIncorrectCredentialsToast();
                logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials');
            }
        }
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleSave):', error);
        logEvent(`[Error] in (handleSave): ${error}`);
    }
};

export const handleClear = async (setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser) => {
    try {
        // Clear all saved credentials and reset UI states
        localStorage.removeItem('steamCookies');
        localStorage.removeItem('cardFarmingUser');
        setSidValue('');
        setSlsValue('');
        setSmaValue('');
        setHasCookies(false);
        setCardFarmingUser(null);

        showSuccessToast(t('toast.cardFarming.logOut'));

        logEvent('[Settings - Card Farming] Logged out');
    } catch (error) {
        showDangerToast(t('common.error'));
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

        // Add radio-button-like behavior for mutually exclusive options
        // Only one of the card farming options can be active at a time
        const checkboxNames = Object.keys(updatedSettings.cardFarming);
        if (checked) {
            // If this checkbox is checked, uncheck the other one
            const otherCheckboxName = checkboxNames.find(checkbox => checkbox !== name);
            updatedSettings.cardFarming[otherCheckboxName] = false;
        } else {
            // Don't allow both checkboxes to be unchecked - keep one enabled
            const otherCheckboxName = checkboxNames.find(checkbox => checkbox !== name);
            if (!updatedSettings.cardFarming[otherCheckboxName]) {
                updatedSettings.cardFarming[name] = true;
            }
        }

        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        updateSettings(updatedSettings, setLocalSettings, setSettings);
        logEvent(`[Settings - Card Farming] Changed '${name}' to '${updatedSettings.cardFarming[name]}'`);
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
    }
};

// Helper function to update both local component state and global app settings
export const updateSettings = (newSettings, setLocalSettings, setSettings) => {
    setLocalSettings(newSettings);
    setSettings(newSettings);
    try {
        localStorage.setItem('settings', JSON.stringify(newSettings));
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (updateSettings):', error);
        logEvent(`[Error] in (updateSettings): ${error}`);
    }
};