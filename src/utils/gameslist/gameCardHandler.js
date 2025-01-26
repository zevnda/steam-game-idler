import { startIdler } from '@/src/utils/utils';

export const handleIdle = async (item, setCurrentIdleList) => {
    await startIdler(item.appid, item.name, false, true, setCurrentIdleList);
};

export const viewAchievments = (item, setAppId, setAppName, setShowAchievements, showAchievements) => {
    setAppId(item.appid);
    setAppName(item.name);
    setShowAchievements(!showAchievements);
};

export const viewStorePage = async (item) => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
        try {
            await window.__TAURI__.shell.open(`https://store.steampowered.com/app/${item.appid}`);
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    }
};

export const viewGameSettings = (item, setAppId, setAppName, onOpen) => {
    setAppId(item.appid);
    setAppName(item.name);
    onOpen();
};