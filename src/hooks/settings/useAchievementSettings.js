import { useState, useEffect } from 'react';
import { initializeSettings } from '@/utils/settings/achievementSettingsHandler';

export default function useAchievementSettings(settings) {
    const [labelInterval, setLabelInterval] = useState(null);
    const [localSettings, setLocalSettings] = useState(null);

    useEffect(() => {
        initializeSettings(settings, setLocalSettings, setLabelInterval);
    }, [settings]);

    return { labelInterval, localSettings, setLocalSettings, setLabelInterval };
}
