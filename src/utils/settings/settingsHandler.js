import { Time } from '@internationalized/date';
import { getVersion } from '@tauri-apps/api/app';

import { logEvent } from '@/utils/global/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/global/toasts';

// Get the application version and set it in the state
export const getAppVersion = async () => {
    try {
        const appVersion = await getVersion();
        return appVersion;
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (getAppVersion):', error);
        logEvent(`[Error] in (getAppVersion): ${error}`);
    }
};

// Get the default settings for the application
export const getDefaultSettings = () => ({
    general: {
        antiAway: false,
        freeGameNotifications: true,
    },
    cardFarming: {
        listGames: true,
        allGames: false
    },
    achievementUnlocker: {
        idle: true,
        hidden: false,
        schedule: false,
        scheduleFrom: new Time(8, 30),
        scheduleTo: new Time(23, 0),
        interval: [30, 130],
    }
});

// Merge the default settings with the current settings
export const getUpdatedSettings = (defaultSettings, currentSettings) => ({
    general: {
        ...defaultSettings.general,
        ...currentSettings.general
    },
    cardFarming: {
        ...defaultSettings.cardFarming,
        ...currentSettings.cardFarming
    },
    achievementUnlocker: {
        ...defaultSettings.achievementUnlocker,
        ...currentSettings.achievementUnlocker
    }
});

export const handleResetSettings = (onClose, setSettings, setRefreshKey) => {
    try {
        localStorage.removeItem('settings');
        localStorage.removeItem('gameSettings');
        localStorage.removeItem('steamCookies');
        setSettings(null);
        setRefreshKey(prevKey => prevKey + 1);
        showSuccessToast('Settings have been reset to default');
        logEvent('[Settings] Reset to default');
        onClose();
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleResetSettings):', error);
        logEvent(`[Error] in (handleResetSettings): ${error}`);
    }
};