import { toast } from 'react-toastify';
import { checkUpdate } from '@tauri-apps/api/updater';
import { logEvent } from '@/utils/utils';

export const useSettingsMenu = (setInitUpdate, setUpdateManifest) => {
    const checkForUpdates = async () => {
        try {
            const { shouldUpdate, manifest } = await checkUpdate();
            if (shouldUpdate) {
                setUpdateManifest(manifest);
                setInitUpdate(true);
            } else {
                toast.info('Steam Game Idler is up to date');
            }
        } catch (error) {
            toast.error(`Error in (checkForUpdates): ${error?.message || error}`);
            console.error('Error in (checkForUpdates):', error);
            logEvent(`[Error] in (checkForUpdates): ${error}`);
        }
    };

    return { checkForUpdates };
};
