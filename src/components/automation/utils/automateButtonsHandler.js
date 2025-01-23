import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';
import ErrorToast from '../../ui/components/ErrorToast';

export const checkSteamStatus = async () => {
    try {
        const steamRunning = await invoke('check_status');
        if (!steamRunning) {
            toast.error(
                <ErrorToast
                    message={'Steam is not running'}
                    href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'}
                />
            );
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
