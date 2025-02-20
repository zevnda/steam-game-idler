import { toast } from 'react-toastify';
import { invoke } from '@tauri-apps/api/tauri';
import { logEvent } from '@/src/utils/utils';
import { useContext } from 'react';
import { AppContext } from '@/src/components/layout/AppContext';
import ErrorToast from '@/src/components/ui/ErrorToast';

// Automate card farming and achievement unlocking
export const useAutomate = () => {
    const { setIsCardFarming, setIsAchievementUnlocker } = useContext(AppContext);
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
                return toast.error(
                    <ErrorToast
                        message={'Steam is not running'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                    />
                );
            }
            if (!steamCookies?.sid || !steamCookies?.sls) {
                return toast.error(
                    <ErrorToast
                        message={'Missing credentials in Settings'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=%22Missing%20credentials%20in%20setting%22'}
                    />
                );
            }
            // Validate Steam session
            const res = await invoke('validate_session', {
                sid: steamCookies?.sid, sls: steamCookies?.sls, sma: steamCookies?.sma, steamid: userSummary.steamId
            });
            if (!res.user) {
                localStorage.removeItem('steamCookies');
                localStorage.removeItem('cardFarmingUser');
                return toast.error(
                    <ErrorToast
                        message={'Steam credentials need to be updated'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=%22Steam%20credentials%20need%20to%20be%20updated%22'}
                    />
                );
            }
            // Retrieve card farming list from local storage
            const cardFarming = JSON.parse(localStorage.getItem('cardFarmingListCache')) || [];
            if (!settings.cardFarming.allGames && cardFarming.length === 0) {
                return toast.error(
                    <ErrorToast
                        message={'Enable the "All games" setting or add some games to your card farming list'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Enable%20the%20%22All%20games%22%20setting%20or%20add%20some%20games%20to%20your%20card%20farming%20list'}
                    />
                );
            }
            setIsCardFarming(true);
        } catch (error) {
            toast.error(`Error in (startCardFarming): ${error?.message || error}`);
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
                return toast.error(
                    <ErrorToast
                        message={'Steam is not running'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                    />
                );
            }
            if (!settings || Object.keys(settings).length === 0) {
                return toast.error('Please configure the settings first');
            }
            // Retrieve achievement unlocker list from local storage
            const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlockerListCache')) || [];
            if (achievementUnlocker.length === 0) {
                return toast.error(
                    <ErrorToast
                        message={'There are no games in your achievement unlocker list'}
                        href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                    />
                );
            }
            setIsAchievementUnlocker(true);
        } catch (error) {
            toast.error(`Error in (startAchievementUnlocker): ${error?.message || error}`);
            console.error('Error in (startAchievementUnlocker):', error);
            logEvent(`[Error] in (startAchievementUnlocker): ${error}`);
        }
    };

    return { startCardFarming, startAchievementUnlocker };
};
