import { useEffect, useState } from 'react';
import { getStoredServerSettings } from '../utils/serverSettingsHandler';

export default function useServerSettings(settings) {
    const [localSettings, setLocalSettings] = useState(null);
    const [hasServerSettings, setHasServerSettings] = useState(false);
    const [portValue, setPortValue] = useState('');
    const [serverType, setServerType] = useState('local');
    const [isConnected, setIsConnected] = useState(false);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        if (settings && settings.serverSettings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    useEffect(() => {
        getStoredServerSettings(setHasServerSettings, setPortValue);
    }, []);

    useEffect(() => {
        const wsConnection = JSON.parse(sessionStorage.getItem('wsConnection')) || {};
        setWs(wsConnection.ws || null);
        setIsConnected(wsConnection.isConnected || false);
    }, []);

    const handlePortChange = (e) => {
        const numericalValue = e.target.value.replace(/\D/g, '');
        setPortValue(numericalValue);
    };

    return {
        localSettings,
        setLocalSettings,
        portValue,
        setPortValue,
        handlePortChange,
        hasServerSettings,
        setHasServerSettings
    };
}