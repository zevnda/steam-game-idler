import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useState, useEffect } from 'react';

import { logEvent } from '@/utils/global/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/global/toasts';

export const useLogs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const fullLogPath = await appDataDir();
                const logFilePath = `${fullLogPath}\\log.txt`;

                // Check if log file exists
                let logContents = '';
                try {
                    logContents = await readTextFile(logFilePath);
                } catch (fileError) {
                    // Create log file if not exists
                    console.error('Error in (fetchLogs) - file had to be created:', fileError);
                    await logEvent('No log file found so one was created');
                    // Try to read again
                    try {
                        logContents = await readTextFile(logFilePath);
                    } catch (retryError) {
                        // Still failed, set empty logs
                        console.error('Error in (fetchLogs) - unable to create file:', retryError);
                        setLogs([]);
                        return;
                    }
                }

                // Process log contents
                const logEntries = logContents.split('\n').filter(entry => entry.trim() !== '').map(entry => {
                    const [timestamp, message] = entry.split(' + ');
                    return { timestamp, message };
                });
                setLogs(logEntries);
            } catch (error) {
                showDangerToast('An error occurred. Check the logs for more information');
                console.error('Error in (fetchLogs):', error);
                logEvent(`[Error] in (fetchLogs): ${error}`);
            }
        };
        fetchLogs();
        const intervalId = setInterval(fetchLogs, 1000);
        return () => clearInterval(intervalId);
    }, []);

    return { logs };
};

export const handleOpenLogFile = async () => {
    try {
        await invoke('open_file_explorer', { path: 'log.txt' });
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleOpenLogFile):', error);
        logEvent(`[Error] in (handleOpenLogFile): ${error}`);
    }
};

export const handleClearLogs = async (log = true) => {
    try {
        await invoke('clear_log_file');
        if (log) {
            showSuccessToast('Logs cleared successfully');
            logEvent('[Settings - Logs] Logs cleared successfully');
        }
    } catch (error) {
        showDangerToast('An error occurred. Check the logs for more information');
        console.error('Error in (handleClearLogs):', error);
        logEvent(`[Error] in (handleClearLogs): ${error}`);
    }
};
