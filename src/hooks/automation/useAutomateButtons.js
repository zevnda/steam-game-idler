import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { checkSteamStatus, logEvent } from '@/utils/global/tasks';
import { showDangerToast, showEnableAllGamesToast, showMissingCredentialsToast, showNoGamesToast, showOutdatedCredentialsToast } from '@/utils/global/toasts';

// Automate card farming and achievement unlocking
export const useAutomate = () => {
    const { userSummary } = useContext(UserContext);
    const { setIsCardFarming, setIsAchievementUnlocker } = useContext(StateContext);
    // Start card farming
    const startCardFarming = async () => {
        try {
            // Check if Steam is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;
            // Retrieve Steam cookies from local storage
            const steamCookies = JSON.parse(localStorage.getItem('steamCookies')) || {};
            // Retrieve settings from local storage
            const settings = JSON.parse(localStorage.getItem('settings')) || {};

            if (!steamCookies?.sid || !steamCookies?.sls) return showMissingCredentialsToast();

            // Validate Steam session
            const res = await invoke('validate_session', {
                sid: steamCookies?.sid, sls: steamCookies?.sls, sma: steamCookies?.sma, steamid: userSummary.steamId
            });
            if (!res.user) {
                localStorage.removeItem('steamCookies');
                localStorage.removeItem('cardFarmingUser');
                return showOutdatedCredentialsToast();
            }
            // Retrieve card farming list
            const cardFarmingList = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'cardFarmingList' });
            if (!settings.cardFarming.allGames && cardFarmingList.list_data.length === 0)
                return showEnableAllGamesToast();
            setIsCardFarming(true);
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (startCardFarming):', error);
            logEvent(`[Error] in (startCardFarming): ${error}`);
        }
    };

    // Start achievement unlocker
    const startAchievementUnlocker = async () => {
        try {
            // Check if Steam is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            // Retrieve settings from local storage
            const settings = JSON.parse(localStorage.getItem('settings')) || {};

            if (!settings || Object.keys(settings).length === 0) {
                return showDangerToast('Please configure the settings first');
            }

            // Retrieve achievement unlocker list
            const achievementUnlockerList = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'achievementUnlockerList' });
            if (achievementUnlockerList.list_data.length === 0)
                return showNoGamesToast();

            setIsAchievementUnlocker(true);
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (startAchievementUnlocker):', error);
            logEvent(`[Error] in (startAchievementUnlocker): ${error}`);
        }
    };

    return { startCardFarming, startAchievementUnlocker };
};
