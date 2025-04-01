import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

import { useStateContext } from '@/components/contexts/StateContext';
import { useUserContext } from '@/components/contexts/UserContext';
import type { InvokeCustomList, InvokeSettings, InvokeValidateSession } from '@/types/invoke';
import { checkSteamStatus, logEvent } from '@/utils/tasks';
import {
    showDangerToast,
    showEnableAllGamesToast,
    showMissingCredentialsToast,
    showNoGamesToast,
    showOutdatedCredentialsToast
} from '@/utils/toasts';

interface AutomateButtonsHook {
    startCardFarming: () => Promise<void>;
    startAchievementUnlocker: () => Promise<void>;
}

// Automate card farming and achievement unlocking
export const useAutomate = (): AutomateButtonsHook => {
    const { t } = useTranslation();
    const { userSummary, userSettings, setUserSettings } = useUserContext();
    const { setIsCardFarming, setIsAchievementUnlocker } = useStateContext();

    // Start card farming
    const startCardFarming = async (): Promise<void> => {
        try {
            // Make sure Steam client is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            // Retrieve Steam cookies from local storage
            const credentials = userSettings.cardFarming.credentials;

            if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast();

            // Validate Steam session
            const response = await invoke<InvokeValidateSession>('validate_session', {
                sid: credentials?.sid,
                sls: credentials?.sls,
                sma: credentials?.sma,
                steamid: userSummary?.steamId
            });

            if (!response.user) {
                await invoke<InvokeSettings>('update_user_settings', {
                    steamId: userSummary?.steamId,
                    key: 'cardFarming.credentials',
                    value: null
                });

                const response = await invoke<InvokeSettings>('update_user_settings', {
                    steamId: userSummary?.steamId,
                    key: 'cardFarming.userSummary',
                    value: null
                });

                setUserSettings(response.settings);
                return showOutdatedCredentialsToast();
            }
            // Retrieve card farming list
            const cardFarmingList = await invoke<InvokeCustomList>('get_custom_lists', {
                steamId: userSummary?.steamId,
                list: 'cardFarmingList'
            });

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
    const startAchievementUnlocker = async (): Promise<void> => {
        try {
            // Make sure Steam client is running
            const isSteamRunning = checkSteamStatus(true);
            if (!isSteamRunning) return;

            // Retrieve achievement unlocker list
            const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
                steamId: userSummary?.steamId,
                list: 'achievementUnlockerList'
            });

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
