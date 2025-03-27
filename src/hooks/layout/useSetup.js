import { invoke } from '@tauri-apps/api/core';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserContext } from '@/components/contexts/UserContext';
import { checkSteamStatus, logEvent } from '@/utils/tasks';
import { showAccountMismatchToast, showDangerToast } from '@/utils/toasts';

export default function useSetup(refreshKey) {
    const { t } = useTranslation();
    const { userSettings, setUserSummary } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [steamUsers, setSteamUsers] = useState([]);
    const [userSummaries, setUserSummaries] = useState([]);

    // Fetch user summary data
    const fetchUserSummary = async (steamId, mostRecent, apiKey) => {
        const res = await invoke('get_user_summary', { steamId, apiKey });
        return {
            steamId: res.response.players[0].steamid,
            personaName: res.response.players[0].personaname,
            avatar: res.response.players[0].avatar.replace('.jpg', '_full.jpg'), // Get high res image
            mostRecent,
        };
    };

    useEffect(() => {
        // Get all steam users
        const getSteamUsers = async () => {
            setIsLoading(true);
            const result = await invoke('get_users');
            const data = JSON.parse(result);

            if (!data.error) {
                const apiKey = userSettings.general?.apiKey;
                const steamUsers = await Promise.all(data.map(user => fetchUserSummary(user.steamId, user.mostRecent, apiKey)));
                // Sort users by last logged in to Steam client - most recent first
                steamUsers.sort((b, a) => a.mostRecent - b.mostRecent);
                setSteamUsers(steamUsers);
                setUserSummaries(steamUsers);
            }
            setIsLoading(false);
        };
        getSteamUsers();
    }, [userSettings.general?.apiKey, refreshKey]);

    const handleLogin = async (index) => {
        try {
            // Make sure Steam is running
            const isSteamRunning = await checkSteamStatus(true);
            if (!isSteamRunning) return;

            setIsLoading(true);
            const userSummary = userSummaries[index];

            // mostRecent !== 1 means this isn't the account that's currently logged in to Steam
            // so show a warning to the user when they log in
            if (userSummaries[index].mostRecent !== 1) showAccountMismatchToast('warning');

            // Save selected user to localStorage and context for app-wide access
            localStorage.setItem('userSummary', JSON.stringify(userSummary));

            setUserSummary(userSummary);
            setIsLoading(false);
            logEvent(`[System] Logged in as ${userSummary.personaName}`);
        } catch (error) {
            setIsLoading(false);
            showDangerToast(t('common.error'));
            console.error('Error in (handleLogin):', error);
            logEvent(`[Error] in (handleLogin): ${error}`);
        }
    };

    return { isLoading, handleLogin, steamUsers };
}
