import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showAccountMismatchToast, showDangerToast, showIncorrectCredentialsToast, showSuccessToast, t } from '@/utils/toasts';

export const useCardSettings = () => {
    const { userSettings } = useContext(UserContext);
    const [sidValue, setSidValue] = useState(''); // sessionid
    const [slsValue, setSlsValue] = useState(''); // steamLoginSecure
    const [smaValue, setSmaValue] = useState(''); // steamMachineAuth
    const [hasCookies, setHasCookies] = useState(false);
    const [cardFarmingUser, setCardFarmingUser] = useState(null);

    // Get stored cookies to set their input values
    useEffect(() => {
        getStoredCookies(userSettings, setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser);
    }, [userSettings]);

    return {
        sidValue,
        slsValue,
        smaValue,
        hasCookies,
        setSidValue,
        setSlsValue,
        setSmaValue,
        setHasCookies,
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

const getStoredCookies = async (userSettings, setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser) => {
    try {
        const credentials = userSettings.cardFarming.credentials;
        const cardFarmingUser = userSettings.cardFarming.userSummary;

        if (credentials && credentials.sid && credentials.sls) {
            setHasCookies(true);
            setSidValue(credentials.sid);
            setSlsValue(credentials.sls);
            setSmaValue(credentials.sma);
        }
        if (cardFarmingUser?.steamId) {
            setCardFarmingUser(cardFarmingUser);
        }
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (getStoredCookies):', error);
        logEvent(`[Error] in (getStoredCookies): ${error}`);
    }
};

export const handleSave = async (
    sidValue,
    slsValue,
    smaValue,
    setHasCookies,
    userSummary,
    setCardFarmingUser,
    userSettings,
    setUserSettings
) => {
    try {
        if (sidValue.length > 0 && slsValue.length > 0) {
            // Verify steam cookies are valid 
            const validate = await invoke('validate_session', { sid: sidValue, sls: slsValue, sma: smaValue, steamid: userSummary.steamId });

            if (validate.user) {
                // Extract steamID from the steamLoginSecure cookie (first 17 chars)
                const steamId = slsValue.slice(0, 17);

                const apiKey = userSettings.general.apiKey;

                const cardFarmingUser = await fetchUserSummary(steamId, apiKey);

                // Make sure user isn't trying to farm cards with different account than they're logged in with
                if (cardFarmingUser.steamId !== userSummary.steamId) {
                    showAccountMismatchToast('danger');
                    return logEvent('[Error] in (handleSave) Account mismatch between Steam and SGI');
                }

                // Save valid cookies and update UI state
                await invoke('update_user_settings', {
                    steamId: userSummary.steamId,
                    key: 'cardFarming.credentials',
                    value: { sid: sidValue, sls: slsValue, sma: smaValue }
                });

                // Save card farming user and update UI state
                const response = await invoke('update_user_settings', {
                    steamId: userSummary.steamId,
                    key: 'cardFarming.userSummary',
                    value: cardFarmingUser
                });

                setUserSettings(response.settings);
                setCardFarmingUser(cardFarmingUser);
                setHasCookies(true);

                showSuccessToast(t('toast.cardFarming.logIn', { user: validate.user }));
                logEvent(`[Settings - Card Farming] Logged in as ${validate.user}`);
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

export const handleClear = async (setHasCookies, setSidValue, setSlsValue, setSmaValue, userSummary, setCardFarmingUser, setUserSettings) => {
    try {
        // Clear all saved credentials and reset UI states
        await invoke('update_user_settings', {
            steamId: userSummary.steamId,
            key: 'cardFarming.credentials',
            value: null
        });
        const response = await invoke('update_user_settings', {
            steamId: userSummary.steamId,
            key: 'cardFarming.userSummary',
            value: null
        });

        setSidValue('');
        setSlsValue('');
        setSmaValue('');
        setHasCookies(false);
        setCardFarmingUser(null);
        setUserSettings(response.settings);

        showSuccessToast(t('toast.cardFarming.logOut'));

        logEvent('[Settings - Card Farming] Logged out');
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleClear):', error);
        logEvent(`[Error] in (handleClear): ${error}`);
    }
};