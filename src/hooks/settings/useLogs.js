import { useState, useEffect } from 'react';

import { invoke } from '@tauri-apps/api/core';

import { logEvent } from '@/utils/utils';
import { addToast } from '@heroui/react';

export default function useLogs() {
    const [logs, setLogs] = useState([]);
    const [logPath, setLogPath] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            if (typeof window !== 'undefined' && window.__TAURI__) {
                try {
                    const fullLogPath = await invoke('get_app_log_dir');
                    const logContents = await window.__TAURI__.fs.readTextFile(`${fullLogPath}\\log.txt`);
                    const logEntries = logContents.split('\n').filter(entry => entry.trim() !== '').map(entry => {
                        const [timestamp, message] = entry.split(' + ');
                        return { timestamp, message };
                    });
                    setLogs(logEntries);
                    setLogPath(`${fullLogPath}\\log.txt`);
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

    return { logs, logPath };
}
