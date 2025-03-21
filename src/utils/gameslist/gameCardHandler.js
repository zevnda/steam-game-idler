import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';

import ErrorToast from '@/components/ui/ErrorToast';
import { startIdle } from '@/utils/global/idle';
import { logEvent } from '@/utils/global/tasks';

export const handleIdle = async (item) => {
    const success = await startIdle(item.appid, item.name, true);
    if (success) {
        addToast({ description: `Started idling ${item.name} (${item.appid})`, color: 'success' });
    } else {
        addToast({ description: `Failed to start idling ${item.name} (${item.appid})`, color: 'danger' });
    }
};

export const handleStopIdle = async (item, idleGamesList, setIdleGamesList) => {
    const game = idleGamesList.find((game) => game.appid === item.appid);
    try {
        const response = await invoke('kill_process_by_pid', { pid: game.pid });
        if (response.success) {
            setIdleGamesList(idleGamesList.filter((i) => i.pid !== item.pid));
            addToast({ description: `Stopped idling ${item.name}`, color: 'success' });
        } else {
            addToast({ description: `Failed to stop idling ${item.name}`, color: 'danger' });
        }
    } catch (error) {
        addToast({ description: `Failed to stop idling ${item.name}`, color: 'danger' });
        console.error('Error in handleStopIdle:', error);
        logEvent(`Error in (handleStopIdle): ${error}`);
    }
};

export const viewAchievments = async (item, setAppId, setAppName, setShowAchievements) => {
    // Check if Steam is running
    const steamRunning = await invoke('is_steam_running');
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