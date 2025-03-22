import { invoke } from '@tauri-apps/api/core';
import { useContext, useEffect, useState } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { checkSteamStatus, logEvent } from '@/utils/global/tasks';
import { showAccountMismatchToast, showDangerToast } from '@/utils/global/toasts';

export default function useSetup(refreshKey) {
    const { setUserSummary } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [steamUsers, setSteamUsers] = useState([]);
    const [userSummaries, setUserSummaries] = useState([]);

    const fetchUserSummary = async (steamId, mostRecent, apiKey) => {
        const res = await invoke('get_user_summary', { steamId, apiKey });
        return {
            steamId: res.response.players[0].steamid,
            personaName: res.response.players[0].personaname,
            avatar: res.response.players[0].avatar.replace('.jpg', '_full.jpg'),
            mostRecent,
        };
    };

    useEffect(() => {
        const getSteamUsers = async () => {
            setIsLoading(true);
            const result = await invoke('get_users');
            const data = JSON.parse(result);

            if (!data.error) {
                const apiKey = localStorage.getItem('apiKey');
                const steamUsers = await Promise.all(data.map(user => fetchUserSummary(user.steamId, user.mostRecent, apiKey)));
                steamUsers.sort((b, a) => a.mostRecent - b.mostRecent);
                setSteamUsers(steamUsers);
                setUserSummaries(steamUsers);
            }
            setIsLoading(false);
        };
        getSteamUsers();
    }, [refreshKey]);

    const handleLogin = async (index) => {
        try {
            const isSteamRunning = await checkSteamStatus(true);
            if (!isSteamRunning) return;

            setIsLoading(true);
            const userSummary = userSummaries[index];

            if (userSummaries[index].mostRecent !== 1) showAccountMismatchToast('warning');

            localStorage.setItem('userSummary', JSON.stringify(userSummary));
            setUserSummary(userSummary);
            setIsLoading(false);
            logEvent(`[System] Logged in as ${userSummary.personaName}`);
        } catch (error) {
            setIsLoading(false);
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleLogin):', error);
            logEvent(`[Error] in (handleLogin): ${error}`);
        }
    };

    return { isLoading, handleLogin, steamUsers };
}
