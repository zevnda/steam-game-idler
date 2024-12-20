import { toast } from 'react-toastify';
import { checkUpdate } from '@tauri-apps/api/updater';
import { fetchLatest, logEvent } from '@/src/utils/utils';
import UpdateToast from '@/src/components/updates/components/UpdateToast';

export const useSettingsMenu = (setInitUpdate, setUpdateManifest) => {
    const checkForUpdates = async () => {
        try {
            const { shouldUpdate, manifest } = await checkUpdate();
            const latest = await fetchLatest();
            if (shouldUpdate) {
                setUpdateManifest(manifest);
                if (latest?.major) {
                    return setInitUpdate(true);
                }
                toast.info(<UpdateToast updateManifest={manifest} setInitUpdate={setInitUpdate} />, { autoClose: false });
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
