import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';

export default function useGetUserSummary(steamId, setUserSummary, setIsLoading) {
    useEffect(() => {
        const getUserSummary = async () => {
            try {
                const apiKey = localStorage.getItem('apiKey');
                const res = await invoke('get_user_summary', { steamId: steamId, apiKey: apiKey });
                const userSummary = {
                    steamId: res.response.players[0].steamid,
                    personaName: res.response.players[0].personaname,
                    avatar: res.response.players[0].avatar
                };
                localStorage.setItem('userSummary', JSON.stringify(userSummary));
                setUserSummary(userSummary);
                setIsLoading(false);
            } catch (error) {
                toast.error(`Error in (getUserSummary): ${error?.message || error}`);
                console.error('Error in (getUserSummary):', error);
                logEvent(`[Error] in (getUserSummary): ${error}`);
            }
        };
        if (steamId) {
            getUserSummary();
        }
    }, [steamId]);
}
