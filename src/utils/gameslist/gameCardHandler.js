import { startIdle } from '@/utils/utils';

export const handleIdle = async (item) => {
    await startIdle(item.appid, item.name, false, true);
};

export const viewAchievments = (item, setAppId, setAppName, setShowAchievements) => {
    setAppId(item.appid);
    setAppName(item.name);
    setShowAchievements(true);
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

export const viewGameSettings = (item, setAppId, setAppName, setSettingsModalOpen) => {
    setAppId(item.appid);
    setAppName(item.name);
    setSettingsModalOpen(true);
};