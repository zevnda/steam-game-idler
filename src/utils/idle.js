import { invoke } from '@tauri-apps/api/core';

import { checkSteamStatus, logEvent } from '@/utils/tasks';
import { showAccountMismatchToast, showWarningToast, t } from '@/utils/toasts';

const idleTimeouts = {};
const idleIntervals = {};

// Start idling a game
export async function startIdle(appId, appName, manual = true) {
    try {
        // Make sure Steam client is running
        const isSteamRunning = checkSteamStatus(true);
        if (!isSteamRunning) return;

        const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        const maxIdleTime = gameSettings[appId]?.maxIdleTime || 0;

        // Make sure the game is not already being idled
        const response = await invoke('get_running_processes');
        const processes = response?.processes;
        const runningIdlers = processes.map(p => p.appid);

        if (runningIdlers.includes(appId)) {
            return showWarningToast(t('toast.startIdle.alreadyIdling', { appName, appId }));
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
            showAccountMismatchToast('danger');
            console.error(`Error starting idler for ${appName} (${appId}): ${idleResponse.error}`);
            logEvent(`[Error] [Idle] Failed to idle ${appName} (${appId}) - account mismatch`);
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
        // Make sure Steam client is running
        const isSteamRunning = checkSteamStatus(true);
        if (!isSteamRunning) return;
        await invoke('start_farm_idle', { appIds });
        logEvent(`[Card Farming] Started idling ${appIds.length} games`);
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