import { useState, useEffect } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

export default function useHeader(setInputValue, setIsQuery) {
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
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const minToTrayNotified = localStorage.getItem('minToTrayNotified') || 'false';
        const { minimizeToTray } = settings?.general || {};
        if (minimizeToTray) {
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
        } else {
            appWindow?.close();
        }
    };

    const handleQuery = () => {
        setIsQuery(true);
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = () => {
        handleQuery('query');
    };

    return {
        windowMinimize,
        windowToggleMaximize,
        windowClose,
        handleChange,
        handleKeyDown
    };
}
