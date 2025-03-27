import { invoke } from '@tauri-apps/api/core';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { checkSteamStatus, logEvent } from '@/utils/tasks';
import { showDangerToast, showEnableAllGamesToast, showMissingCredentialsToast, showNoGamesToast, showOutdatedCredentialsToast } from '@/utils/toasts';

// Automate card farming and achievement unlocking
export const useAutomate = () => {
    const { t } = useTranslation();
    const { userSummary, userSettings, setUserSettings } = useContext(UserContext);
    const { setIsCardFarming, setIsAchievementUnlocker } = useContext(StateContext);

    // Start card farming
    const startCardFarming = async () => {
        try {
            // Make sure Steam client is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            // Retrieve Steam cookies from local storage
            const credentials = userSettings.cardFarming.credentials;

            if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast();

            // Validate Steam session
            const res = await invoke('validate_session', {
                sid: credentials?.sid, sls: credentials?.sls, sma: credentials?.sma, steamid: userSummary.steamId
            });

            if (!res.user) {
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
                setUserSettings(response.settings);
                return showOutdatedCredentialsToast();
            }
            // Retrieve card farming list
            const cardFarmingList = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'cardFarmingList' });
            if (!userSettings.cardFarming.allGames && cardFarmingList.list_data.length === 0)
                return showEnableAllGamesToast();
            setIsCardFarming(true);
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (startCardFarming):', error);
            logEvent(`[Error] in (startCardFarming): ${error}`);
        }
    };

    // Start achievement unlocker
    const startAchievementUnlocker = async () => {
        try {
            // Make sure Steam client is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            // Retrieve achievement unlocker list
            const achievementUnlockerList = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'achievementUnlockerList' });
            if (achievementUnlockerList.list_data.length === 0)
                return showNoGamesToast();

            setIsAchievementUnlocker(true);
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (startAchievementUnlocker):', error);
            logEvent(`[Error] in (startAchievementUnlocker): ${error}`);
        }
    };

    return { startCardFarming, startAchievementUnlocker };
};
