import { useState, useEffect } from 'react';

import { logEvent } from '@/utils/tasks';
import { showDangerToast } from '@/utils/toasts';

export const useAchievementSettings = (settings, setLocalSettings) => {
    const [labelInterval, setLabelInterval] = useState(null);

    // Sync local settings with global settings when they change
    useEffect(() => {
        if (setLocalSettings && settings && settings.achievementUnlocker) {
            setLocalSettings(settings);
            setLabelInterval(`${settings.achievementUnlocker.interval[0]} to ${settings.achievementUnlocker.interval[1]}`);
        }
    }, [settings, setLocalSettings]);

    return { labelInterval, setLabelInterval };
};

// Handle changes to checkboxes in the settings
export const achievementCheckboxChange = (e, localSettings, setLocalSettings, setSettings) => {
    try {
        const { name, checked } = e.target;
        if (localSettings && localSettings.achievementUnlocker) {
            const updatedSettings = {
                ...localSettings,
                achievementUnlocker: {
                    ...localSettings.achievementUnlocker,
                    [name]: checked
                }
            };
            updateSettings(updatedSettings, setLocalSettings, setSettings);
            logEvent(`[Settings - Achievement Unlocker] Changed '${name}' to '${checked}'`);
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleCheckboxChange):', error);
        logEvent(`[Error] in (handleCheckboxChange): ${error}`);
    }
};

// Handle changes to the slider in the settings
export const handleSliderChange = (e, localSettings, setLocalSettings, setSettings) => {
    try {
        if (localSettings && localSettings.achievementUnlocker) {
            const updatedSettings = {
                ...localSettings,
                achievementUnlocker: {
                    ...localSettings.achievementUnlocker,
                    interval: e
                }
            };
            updateSettings(updatedSettings, setLocalSettings, setSettings);
            logEvent(`[Settings - Achievement Unlocker] Changed 'interval' to '${e}'`);
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleSliderChange):', error);
        logEvent(`[Error] in (handleSliderChange): ${error}`);
    }
};

// Handle changes to the schedule in the settings
export const handleScheduleChange = (value, type, localSettings, setLocalSettings, setSettings) => {
    try {
        if (localSettings && localSettings.achievementUnlocker) {
            const updatedSettings = {
                ...localSettings,
                achievementUnlocker: {
                    ...localSettings.achievementUnlocker,
                    [type]: value
                }
            };
            updateSettings(updatedSettings, setLocalSettings, setSettings);
            logEvent(`[Settings - Achievement Unlocker] Changed '${type}' to '${value.toString()}'`);
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleScheduleChange):', error);
        logEvent(`[Error] in (handleScheduleChange): ${error}`);
    }
};

// Update the interval label based on the slider values
export const updateLabel = (e, setLabelInterval) => {
    setLabelInterval(`${e[0]} and ${e[1]}`);
};

// Update settings in local state and save to local storage
const updateSettings = (newSettings, setLocalSettings, setSettings) => {
    setLocalSettings(newSettings);
    setSettings(newSettings);
    try {
        localStorage.setItem('settings', JSON.stringify(newSettings));
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (updateSettings):', error);
        logEvent(`[Error] in (updateSettings): ${error}`);
    }
};
