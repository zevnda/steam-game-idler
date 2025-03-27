import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, t } from '@/utils/toasts';

export const useAchievementSettings = () => {
    const { t } = useTranslation();
    const { userSettings } = useContext(UserContext);
    const [sliderLabel, setSliderLabel] = useState('');

    // Sync local settings with global settings when they change
    useEffect(() => {
        const interval = userSettings.achievementUnlocker?.interval;
        setSliderLabel(t('settings.achievementUnlocker.interval', { min: interval[0], max: interval[1] }));
    }, [userSettings.achievementUnlocker?.interval, setSliderLabel, t]);

    return { sliderLabel, setSliderLabel };
};

// Handle changes to the slider in the settings
export const handleSliderChange = async (e, userSummary, setUserSettings) => {
    try {
        const newInterval = e;
        const response = await invoke('update_user_settings', {
            steamId: userSummary.steamId,
            key: 'achievementUnlocker.interval',
            value: newInterval
        });
        setUserSettings(response.settings);
        logEvent(`[Settings - Achievement Unlocker] Changed 'interval' to '${e}'`);
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleSliderChange):', error);
        logEvent(`[Error] in (handleSliderChange): ${error}`);
    }
};

// Handle changes to the schedule in the settings
export const handleScheduleChange = async (value, type, userSummary, setUserSettings) => {
    try {
        const response = await invoke('update_user_settings', {
            steamId: userSummary.steamId,
            key: `achievementUnlocker.${type}`,
            value
        });
        setUserSettings(response.settings);
        logEvent(`[Settings - Achievement Unlocker] Changed '${type}' to '${value.toString()}'`);
    } catch (error) {
        showDangerToast(t('common.error'));
        console.error('Error in (handleScheduleChange):', error);
        logEvent(`[Error] in (handleScheduleChange): ${error}`);
    }
};
