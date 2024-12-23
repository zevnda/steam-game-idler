import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';

export const checkSteamStatus = async () => {
    try {
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            toast.error('Steam is not running');
            return false;
        }
        return true;
    } catch (error) {
        toast.error(`Error in (checkSteamStatus): ${error?.message || error}`);
        console.error('Error in (checkSteamStatus):', error);
        logEvent(`[Error] in (checkSteamStatus): ${error}`);
        return false;
    }
};
