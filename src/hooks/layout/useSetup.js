import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useContext, useEffect, useState } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/global/tasks';

export default function useSetup() {
    const { setUserSummary } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [steamUsers, setSteamUsers] = useState([]);
    const [userSummaries, setUserSummaries] = useState([]);

    const fetchUserSummary = async (steamId, apiKey) => {
        const res = await invoke('get_user_summary', { steamId, apiKey });
        return {
            steamId: res.response.players[0].steamid,
            personaName: res.response.players[0].personaname,
            avatar: res.response.players[0].avatar.replace('.jpg', '_full.jpg')
        };
    };

    useEffect(() => {
        const getSteamUsers = async () => {
            setIsLoading(true);
            const result = await invoke('get_users');
            const data = JSON.parse(result);

            if (!data.error) {
                const apiKey = localStorage.getItem('apiKey');
                const steamUsers = await Promise.all(data.map(user => fetchUserSummary(user.steamId, apiKey)));
                setSteamUsers(steamUsers);
                setUserSummaries(steamUsers);
            }
            setIsLoading(false);
        };
        getSteamUsers();
    }, []);

    const handleLogin = async (index) => {
        try {
            setIsLoading(true);
            const userSummary = userSummaries[index];
            localStorage.setItem('userSummary', JSON.stringify(userSummary));
            setUserSummary(userSummary);
            setIsLoading(false);
            logEvent(`[System] Logged in as ${userSummary.personaName}`);
        } catch (error) {
            setIsLoading(false);
            addToast({ description: `Error in (handleLogin): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleLogin):', error);
            logEvent(`[Error] in (handleLogin): ${error}`);
        }
    };

    return { isLoading, handleLogin, steamUsers };
}
