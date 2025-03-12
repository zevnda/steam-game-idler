import { invoke } from '@tauri-apps/api/core';
import { logEvent } from '@/utils/utils';
import { useContext } from 'react';
import { StateContext } from '@/components/contexts/StateContext';
import ErrorToast from '@/components/ui/ErrorToast';
import { addToast } from '@heroui/react';

// Automate card farming and achievement unlocking
export const useAutomate = () => {
    const { setIsCardFarming, setIsAchievementUnlocker } = useContext(StateContext);
    // Start card farming
    const startCardFarming = async () => {
        try {
            // Retrieve user summary from local storage
            const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
            // Check if Steam is running
            const steamRunning = await invoke('check_status');
            // Retrieve Steam cookies from local storage
            const steamCookies = JSON.parse(localStorage.getItem('steamCookies')) || {};
            // Retrieve settings from local storage
            const settings = JSON.parse(localStorage.getItem('settings')) || {};
            if (!steamRunning) {
                return addToast({
                    description: <ErrorToast
                        message={'Steam is not running'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                    />,
                    color: 'danger'
                });
            }
            if (!steamCookies?.sid || !steamCookies?.sls) {
                return addToast({
                    description: <ErrorToast
                        message={'Missing credentials in Settings'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=%22Missing%20credentials%20in%20setting%22'}
                    />,
                    color: 'danger'
                });
            }
            // Validate Steam session
            const res = await invoke('validate_session', {
                sid: steamCookies?.sid, sls: steamCookies?.sls, sma: steamCookies?.sma, steamid: userSummary.steamId
            });
            if (!res.user) {
                localStorage.removeItem('steamCookies');
                localStorage.removeItem('cardFarmingUser');
                return addToast({
                    description: <ErrorToast
                        message={'Steam credentials need to be updated'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=%22Steam%20credentials%20need%20to%20be%20updated%22'}
                    />,
                    color: 'danger'
                });
            }
            // Retrieve card farming list from local storage
            const cardFarming = JSON.parse(localStorage.getItem('cardFarmingListCache')) || [];
            if (!settings.cardFarming.allGames && cardFarming.length === 0) {
                return addToast({
                    description: <ErrorToast
                        message={'Enable the "All games" setting or add some games to your card farming list'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Enable%20the%20%22All%20games%22%20setting%20or%20add%20some%20games%20to%20your%20card%20farming%20list'}
                    />,
                    color: 'danger'
                });
            }
            setIsCardFarming(true);
        } catch (error) {
            addToast({ description: `Error in (startCardFarming): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (startCardFarming):', error);
            logEvent(`[Error] in (startCardFarming): ${error}`);
        }
    };

    // Start achievement unlocker
    const startAchievementUnlocker = async () => {
        try {
            // Check if Steam is running
            const steamRunning = await invoke('check_status');
            // Retrieve settings from local storage
            const settings = JSON.parse(localStorage.getItem('settings')) || {};
            if (!steamRunning) {
                return addToast({
                    description: <ErrorToast
                        message={'Steam is not running'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                    />,
                    color: 'danger'
                });
            }
            if (!settings || Object.keys(settings).length === 0) {
                return addToast({ description: 'Please configure the settings first', color: 'danger' });
            }
            // Retrieve achievement unlocker list from local storage
            const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlockerListCache')) || [];
            if (achievementUnlocker.length === 0) {
                return addToast({
                    description: <ErrorToast
                        message={'There are no games in your achievement unlocker list'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                    />,
                    color: 'danger'
                });
            }
            setIsAchievementUnlocker(true);
        } catch (error) {
            addToast({ description: `Error in (startAchievementUnlocker): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (startAchievementUnlocker):', error);
            logEvent(`[Error] in (startAchievementUnlocker): ${error}`);
        }
    };

    return { startCardFarming, startAchievementUnlocker };
};
