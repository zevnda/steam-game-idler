import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';

import ErrorToast from '@/components/ui/ErrorToast';
import { logEvent } from '@/utils/global/tasks';

const idleTimeouts = {};
const idleIntervals = {};

// Start idling a game
export async function startIdle(appId, appName, manual = true) {
    try {
        const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        const maxIdleTime = gameSettings[appId]?.maxIdleTime || 0;

        const steamRunning = await invoke('is_steam_running');

        if (steamRunning) {
            // Make sure the game is not already being idled
            const response = await invoke('get_running_processes');
            const processes = response?.processes;
            const runningIdlers = processes.map(p => p.appid);

            if (runningIdlers.includes(appId)) {
                return addToast({ description: `${appName} (${appId}) is already being idled`, color: 'warning' });
            }

            const idleResponse = await invoke('start_idle', {
                appId: parseInt(appId),
                appName
            });

            if (idleResponse.success) {
                // If maxIdleTime is set, stop idling after the specified time
                if (manual && maxIdleTime > 0) {
                    idleTimeouts[appId] = setTimeout(() => {
                        stopIdle(appId, appName);
                    }, maxIdleTime * 60000);

                    idleIntervals[appId] = setInterval(async () => {
                        const response = await invoke('get_running_processes');
                        const processes = response?.processes;
                        const runningIdlers = processes.map(p => p.appid);
                        // If the game is no longer being idled, clear the timeout and interval
                        if (!runningIdlers.includes(appId)) {
                            clearTimeout(idleTimeouts[appId]);
                            clearInterval(idleIntervals[appId]);
                            delete idleTimeouts[appId];
                            delete idleIntervals[appId];
                        }
                    }, 5000);
                }
                logEvent(`[Idle] Started idling ${appName} (${appId})`);
                return true;
            } else {
                console.error(`Error starting idler for ${appName} (${appId}): ${idleResponse.error}`);
                addToast({
                    description: <ErrorToast
                        message='Are you logged in to the correct account?'
                        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Are%20you%20logged%20in%20to%20the%20correct%20account%3F'
                    />,
                    color: 'danger'
                });
                logEvent(`[Error] [Idle] Failed to idle ${appName} (${appId}) - account mismatch`);
            }
        } else {
            console.error('Steam is not running');
            addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }
    } catch (error) {
        console.error('Error in startIdle util: ', error);
        logEvent(`[Error] in (startIdle) util: ${error}`);
    }
};

// Stop idling a game
export async function stopIdle(appId, appName) {
    try {
        if (idleTimeouts[appId]) {
            clearTimeout(idleTimeouts[appId]);
            delete idleTimeouts[appId];
        }
        if (idleIntervals[appId]) {
            clearInterval(idleIntervals[appId]);
            delete idleIntervals[appId];
        }
        const response = await invoke('stop_idle', { appId: parseInt(appId) });
        if (response.success) {
            logEvent(`[Idle] Stopped idling ${appName} (${appId})`);
        }
    } catch (error) {
        console.error('Error in stopIdle util (these errors can often be ignored): ', error);
    }
};

// Start farming idle
export async function startFarmIdle(appIds) {
    try {
        const steamRunning = await invoke('is_steam_running');

        if (steamRunning) {
            await invoke('start_farm_idle', { appIds });
            logEvent(`[Card Farming] Started idling ${appIds.length} games`);
        } else {
            console.error('Steam is not running');
            addToast({
                description: <ErrorToast
                    message='Steam is not running'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
                />,
                color: 'danger'
            });
        }
    } catch (error) {
        console.error('Error in startFarmIdle util: ', error);
        logEvent(`[Error] in (startFarmIdle) util: ${error}`);
    }
}

// Stop farming idle
export async function stopFarmIdle(appIds) {
    try {
        await invoke('stop_farm_idle');
        logEvent(`[Card Farming] Stopped idling ${appIds.length} games`);
    } catch (error) {
        console.error('Error in stopFarmIdle util (these errors can often be ignored): ', error);
    }
}