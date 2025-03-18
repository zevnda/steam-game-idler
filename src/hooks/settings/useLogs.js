import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

import { logEvent } from '@/utils/utils';

export const useLogs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (typeof window !== 'undefined' && window.__TAURI__) {
                try {
                    const fullLogPath = await invoke('get_app_log_dir');
                    const logFilePath = `${fullLogPath}\\log.txt`;

                    // Check if log file exists
                    let logContents = '';
                    try {
                        logContents = await window.__TAURI__.fs.readTextFile(logFilePath);
                    } catch (fileError) {
                        // Create log file if not exists
                        console.error('Error in (fetchLogs) - file had to be created:', fileError);
                        await logEvent('No log file found so one was created');
                        // Try to read again
                        try {
                            logContents = await window.__TAURI__.fs.readTextFile(logFilePath);
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
                    addToast({ description: `Error in (fetchLogs): ${error?.message || error}`, color: 'danger' });
                    console.error('Error in (fetchLogs):', error);
                    logEvent(`[Error] in (fetchLogs): ${error}`);
                }
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
