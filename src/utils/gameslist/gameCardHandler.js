import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';

import ErrorToast from '@/components/ui/ErrorToast';
import { startIdle } from '@/utils/utils';

export const handleIdle = async (item) => {
    await startIdle(item.appid, item.name, false, true);
};

export const viewAchievments = async (item, setAppId, setAppName, setShowAchievements) => {
    // Check if Steam is running
    const steamRunning = await invoke('check_status');
    if (!steamRunning) {
        return addToast({
            description: <ErrorToast
                message='Steam is not running'
                href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
            />,
            color: 'danger'
        });
    }

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