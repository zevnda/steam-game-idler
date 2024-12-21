import { toast } from 'react-toastify';
import { invoke } from '@tauri-apps/api/tauri';
import { logEvent } from '@/src/utils/utils';
import { AppContext } from '../../layouts/components/AppContext';
import { useContext } from 'react';

// Automate card farming and achievement unlocking
export const useAutomate = () => {
    const { setActivePage } = useContext(AppContext);
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
                return toast.error('Steam is not running');
            }
            if (!steamCookies?.sid || !steamCookies?.sls) {
                return toast.error('Missing credentials in Settings');
            }
            // Validate Steam session
            const res = await invoke('validate_session', { sid: steamCookies?.sid, sls: steamCookies?.sls, sma: steamCookies?.sma, steamid: userSummary.steamId });
            if (!res.user) {
                localStorage.removeItem('steamCookies');
                return toast.error('Steam credentials need to be updated');
            }
            // Retrieve card farming list from local storage
            const cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
            if (!settings.cardFarming.allGames && cardFarming.length < 1) {
                return toast.error('Enable the "All games" setting or add some games to your card farming list');
            }
            setActivePage('card-farming');
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
                return toast.error('Steam is not running');
            }
            if (!settings || Object.keys(settings).length < 1) {
                return toast.error('Please configure the settings first');
            }
            // Retrieve achievement unlocker list from local storage
            const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
            if (achievementUnlocker.length < 1) {
                return toast.error('No games in achievement unlocker list');
            }
            setActivePage('achievement-unlocker');
        } catch (error) {
            toast.error(`Error in (startAchievementUnlocker): ${error?.message || error}`);
            console.error('Error in (startAchievementUnlocker):', error);
            logEvent(`[Error] in (startAchievementUnlocker): ${error}`);
        }
    };

    return { startCardFarming, startAchievementUnlocker };
};
