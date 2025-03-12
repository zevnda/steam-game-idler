import { useContext } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { AppContext } from '@/components/layout/AppContext';
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function useHeader(setGameQueryValue, setAchievementQueryValue) {
    const { setIsQuery } = useContext(AppContext);

    const windowMinimize = async () => {
        await getCurrentWindow().minimize();

    };

    const windowToggleMaximize = async () => {
        await getCurrentWindow().toggleMaximize();
    };

    const windowClose = async () => {
        await getCurrentWindow().hide();

        const minToTrayNotified = localStorage.getItem('minToTrayNotified') || 'false';
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

    const handleGameQueryChange = (e) => {
        setGameQueryValue(e.target.value);
    };

    const handleAchievementQueryChange = (e) => {
        setAchievementQueryValue(e.target.value);
    };

    const handleKeyDown = () => {
        setIsQuery(true);
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
