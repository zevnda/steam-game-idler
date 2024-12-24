import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';
import ErrorToast from '../../ui/components/ErrorToast';

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
        toast.error(`Error in (validateSession): ${error?.message || error}`);
        console.error('Error in (validateSession):', error);
        logEvent(`[Error] in (validateSession): ${error}`);
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
                    return toast.error(
                        <ErrorToast
                            message={'[Card Farming] Account mismatch between Steam and SGI'}
                            href={'https://github.com/zevnda/steam-game-idler/wiki/FAQ#error-messages:~:text=%22-,Account%20mismatch,-%22'}
                        />
                    );
                }

                localStorage.setItem('steamCookies', JSON.stringify({ sid: sidValue, sls: slsValue, sma: smaValue }));
                setHasCookies(true);

                setCardFarmingUser(cardFarmingUser);
                localStorage.setItem('cardFarmingUser', JSON.stringify(cardFarmingUser));

                toast.success(`[Card Farming] Logged in as ${res.user}`);
                logEvent(`[Settings - Card Farming] Logged in as ${res.user}`);
            } else {
                toast.error(
                    <ErrorToast
                        message={'[Card Farming] Incorrect card farming credentials'}
                        href={'https://github.com/zevnda/steam-game-idler/wiki/FAQ#error-messages:~:text=Incorrect%20card%20farming%20credentials'}
                    />
                );
                logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials');
            }
        }
    } catch (error) {
        toast.error(`Error in (handleSave): ${error?.message || error}`);
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
