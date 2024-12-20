import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';
import useGetUserSummary from '../utils/getUserSummaryHandler';

export default function useSetup(setUserSummary) {
    const [isLoading, setIsLoading] = useState(false);
    const [steamId, setSteamId] = useState(null);

    useGetUserSummary(steamId, setUserSummary, setIsLoading);

    const handleClick = async () => {
        try {
            setIsLoading(true);
            const path = await invoke('get_file_path');
            const fullPath = path.replace('Steam Game Idler.exe', 'libs\\SteamUtility.exe');
            const result = await invoke('check_steam_status', { filePath: fullPath });
            if (result === 'not_running') {
                setIsLoading(false);
                return toast.error('The Steam desktop app is not running, or you are not signed in');
            } else {
                setSteamId(result);
                logEvent('[System] Logged in');
            }
        } catch (error) {
            toast.error(`Error in (handleClick): ${error?.message || error}`);
            console.error('Error in (handleClick):', error);
            logEvent(`[Error] in (handleClick): ${error}`);
        }
    };

    return { isLoading, handleClick };
}
