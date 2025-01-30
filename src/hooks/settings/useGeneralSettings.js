import { useEffect, useState } from 'react';
import { initializeSettings, checkStartupState, loadApiKey } from '@/src/utils/settings/generalSettingsHandler';

export default function useGeneralSettings(settings) {
    const [localSettings, setLocalSettings] = useState(null);
    const [startupState, setStartupState] = useState(null);
    const [keyValue, setKeyValue] = useState('');
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        initializeSettings(settings, setLocalSettings);
    }, [settings]);

    useEffect(() => {
        checkStartupState(setStartupState);
    }, []);

    useEffect(() => {
        loadApiKey(setHasKey, setKeyValue);
    }, []);

    return {
        localSettings,
        setLocalSettings,
        startupState,
        setStartupState,
        keyValue,
        setKeyValue,
        hasKey,
        setHasKey
    };
}
