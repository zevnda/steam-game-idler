import { Time } from '@internationalized/date';
import { useEffect, useState } from 'react';

import { getAppVersion } from '@/utils/tasks';

export default function useSettings() {
    const [settings, setSettings] = useState(null);
    const [localSettings, setLocalSettings] = useState(null);
    const [version, setVersion] = useState('v0.0.0');
    const [refreshKey, setRefreshKey] = useState(0);

    // Get the app version
    useEffect(() => {
        const getAndSetVersion = async () => {
            const version = await getAppVersion();
            setVersion(version);
        };
        getAndSetVersion();
    }, []);

    // Merge default and local settings
    useEffect(() => {
        const defaultSettings = getDefaultSettings();
        const currentSettings = JSON.parse(localStorage.getItem('settings')) || {};
        const updatedSettings = getUpdatedSettings(defaultSettings, currentSettings);

        // Only update localStorage if settings actually changed
        if (JSON.stringify(currentSettings) !== JSON.stringify(updatedSettings)) {
            localStorage.setItem('settings', JSON.stringify(updatedSettings));
        }
        setSettings(updatedSettings);
    }, [refreshKey]);

    // Keep a separate local copy of settings for the UI to modify
    // before committing changes to actual settings
    useEffect(() => {
        const currentSettings = JSON.parse(localStorage.getItem('settings')) || {};
        if (currentSettings) {
            setLocalSettings(currentSettings);
        }
    }, [settings, setLocalSettings]);

    return { settings, setSettings, localSettings, setLocalSettings, version, refreshKey, setRefreshKey };
}

// Get the default settings
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

// Merge default and current settings
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