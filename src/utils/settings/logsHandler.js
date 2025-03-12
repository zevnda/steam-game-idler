import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/utils/utils';

export const handleOpenLogFile = async (logPath) => {
    try {
        await invoke('open_file_explorer', { path: logPath });
    } catch (error) {
        toast.error(`Error in (handleOpenLogFile): ${error?.message || error}`);
        console.error('Error in (handleOpenLogFile):', error);
        logEvent(`[Error] in (handleOpenLogFile): ${error}`);
    }
};

export const handleClearLogs = async (log = true) => {
    try {
        await invoke('clear_log_file');
        if (log) {
            toast.success('[Logs] Logs cleared successfully');
            logEvent('[Settings - Logs] Logs cleared successfully');
        }
    } catch (error) {
        toast.error(`Error in (handleClearLogs): ${error?.message || error}`);
        console.error('Error in (handleClearLogs):', error);
        logEvent(`[Error] in (handleClearLogs): ${error}`);
    }
};
