import { useState, useEffect, useContext } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
import { AppContext } from '@/src/components/layout/AppContext';

export default function useHeader(setGameQueryValue, setAchievementQueryValue) {
    const { setIsQuery } = useContext(AppContext);
    const [appWindow, setAppWindow] = useState();

    useEffect(() => {
        async function setupAppWindow() {
            const appWindow = (await import('@tauri-apps/api/window')).appWindow;
            setAppWindow(appWindow);
        }
        setupAppWindow();
    }, []);

    const windowMinimize = () => {
        appWindow?.minimize();
    };

    const windowToggleMaximize = () => {
        appWindow?.toggleMaximize();
    };

    const windowClose = async () => {
        const minToTrayNotified = localStorage.getItem('minToTrayNotified') || 'false';
        appWindow?.hide();
        let permissionGranted = await isPermissionGranted();
        if (minToTrayNotified !== 'true') {
            if (!permissionGranted) {
                const permission = await requestPermission();
                permissionGranted = permission === 'granted';
            }
            if (permissionGranted) {
                sendNotification({
                    title: 'Steam Game Idler will continue to run in the background',
                    icon: 'icons/32x32.png'
                });
            }
        }
        localStorage.setItem('minToTrayNotified', 'true');
    };

    const handleQuery = () => {
        setIsQuery(true);
    };

    const handleGameQueryChange = (e) => {
        setGameQueryValue(e.target.value);
    };

    const handleAchievementQueryChange = (e) => {
        setAchievementQueryValue(e.target.value);
    };

    const handleKeyDown = () => {
        handleQuery('query');
    };

    return {
        windowMinimize,
        windowToggleMaximize,
        windowClose,
        handleGameQueryChange,
        handleAchievementQueryChange,
        handleKeyDown
    };
}
