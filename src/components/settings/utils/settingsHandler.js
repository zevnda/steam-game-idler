import { getVersion } from '@tauri-apps/api/app';
import { Time } from '@internationalized/date';
import { logEvent } from '@/src/utils/utils';

// Get the application version and set it in the state
export const getAppVersion = async (setVersion, toast) => {
    try {
        const appVersion = await getVersion();
        setVersion(appVersion);
    } catch (error) {
        toast.error(`Error in (getAppVersion): ${error?.message || error}`);
        console.error('Error in (getAppVersion):', error);
        logEvent(`[Error] in (getAppVersion): ${error}`);
    }
};

// Get the default settings for the application
export const getDefaultSettings = () => ({
    general: {
        stealthIdle: false,
        antiAway: false,
        clearData: true,
        minimizeToTray: true,
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
