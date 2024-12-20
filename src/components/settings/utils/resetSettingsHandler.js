import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';

export const handleResetSettings = (onClose, setSettings, setRefreshKey) => {
    try {
        localStorage.removeItem('settings');
        localStorage.removeItem('steamCookies');
        setSettings(null);
        setRefreshKey(prevKey => prevKey + 1);
        toast.success('[Settings] Reset to default');
        logEvent('[Settings] Reset to default');
        onClose();
    } catch (error) {
        toast.error(`Error in (handleResetSettings): ${error?.message || error}`);
        console.error('Error in (handleResetSettings):', error);
        logEvent(`[Error] in (handleResetSettings): ${error}`);
    }
};
