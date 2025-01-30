import { useEffect, useState } from 'react';

import { getVersion } from '@tauri-apps/api/app';
import { installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';

import { toast } from 'react-toastify';

import { logEvent } from '@/src/utils/utils';

export default function useUpdateScreen(updateManifest) {
    const [appWindow, setAppWindow] = useState();
    const [progress, setProgress] = useState(0);
    const [checkForUpdate, setCheckForUpdate] = useState(true);

    useEffect(() => {
        const setupAppWindow = async () => {
            const appWindow = (await import('@tauri-apps/api/window')).appWindow;
            setAppWindow(appWindow);
        };
        setupAppWindow();
    }, []);

    useEffect(() => {
        const performUpdate = async () => {
            setTimeout(async () => {
                setCheckForUpdate(false);
                try {
                    const currentVersion = await getVersion();
                    const newVersion = updateManifest ? updateManifest?.version : 'Unknown';
                    localStorage.setItem('hasUpdated', true);
                    logEvent(`[System] Updated Steam Game Idler (${currentVersion} > ${newVersion})`);
                    await installUpdate();
                    await relaunch();
                } catch (error) {
                    toast.error(`Error in (performUpdate): ${error?.message || error}`);
                    console.error('Error in (performUpdate):', error);
                    logEvent(`[Error] in (performUpdate): ${error}`);
                }
            }, 2000);
        };
        performUpdate();
    }, [updateManifest]);

    useEffect(() => {
        const progressInt = setInterval(() => {
            setProgress((prevValue) => {
                if (prevValue >= 100) {
                    clearInterval(progressInt);
                    return prevValue;
                }
                return prevValue + 10;
            });
        }, 100);
        return () => clearInterval(progressInt);
    }, []);

    return { appWindow, progress, checkForUpdate };
}
