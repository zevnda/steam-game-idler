import { logEvent } from '@/src/utils/utils';
import { toast } from 'react-toastify';

export const handleUpdate = async (closeToast, setInitUpdate) => {
    try {
        closeToast();
        setTimeout(() => {
            setInitUpdate(true);
        }, 500);
    } catch (error) {
        toast.error(`Error in (checkForUpdates): ${error?.message || error}`);
        console.error('Error in (checkForUpdates):', error);
        logEvent(`[Error] in (checkForUpdates): ${error}`);
    }
};