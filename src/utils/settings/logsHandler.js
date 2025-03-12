import { invoke } from '@tauri-apps/api/core';
import { logEvent } from '@/utils/utils';
import { addToast } from '@heroui/react';

export const handleOpenLogFile = async (logPath) => {
    try {
        await invoke('open_file_explorer', { path: logPath });
    } catch (error) {
        addToast({ description: `Error in (handleOpenLogFile): ${error?.message || error}`, color: 'danger' });
        console.error('Error in (handleOpenLogFile):', error);
        logEvent(`[Error] in (handleOpenLogFile): ${error}`);
    }
};

export const handleClearLogs = async (log = true) => {
    try {
        await invoke('clear_log_file');
        if (log) {
            addToast({ description: 'Logs cleared successfully', color: 'success' });
            logEvent('[Settings - Logs] Logs cleared successfully');
        }
    } catch (error) {
        addToast({ description: `Error in (handleClearLogs): ${error?.message || error}`, color: 'danger' });
        console.error('Error in (handleClearLogs):', error);
        logEvent(`[Error] in (handleClearLogs): ${error}`);
    }
};
