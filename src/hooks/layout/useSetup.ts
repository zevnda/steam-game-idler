import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserContext } from '@/components/contexts/UserContext';
import type { InvokeUsers, InvokeUserSummary, UserSummary } from '@/types';
import { checkSteamStatus, logEvent } from '@/utils/tasks';
import { showAccountMismatchToast, showDangerToast } from '@/utils/toasts';

interface SetupHook {
    isLoading: boolean;
    handleLogin: (index: number) => Promise<void>;
    steamUsers: UserSummary[];
}

export default function useSetup(refreshKey: number): SetupHook {
    const { t } = useTranslation();
    const { userSettings, setUserSummary } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [steamUsers, setSteamUsers] = useState<UserSummary[]>([]);
    const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);

    // Fetch user summary data
    const fetchUserSummary = async (
        steamId: string,
        mostRecent: number,
        apiKey: string | null,
    ): Promise<UserSummary> => {
        const res = await invoke<InvokeUserSummary>('get_user_summary', { steamId, apiKey });
        return {
            steamId: res.response.players[0].steamid,
            personaName: res.response.players[0].personaname,
            avatar: res.response.players[0].avatar.replace('.jpg', '_full.jpg'), // Get high res image
            mostRecent,
        };
    };

    useEffect(() => {
        // Get all steam users
        const getSteamUsers = async (): Promise<void> => {
            setIsLoading(true);
            const response = await invoke<InvokeUsers>('get_users');

            if (response.users) {
                const apiKey = userSettings.general?.apiKey;
                const steamUsers = await Promise.all(
                    response.users
                        .filter(user => user?.steamId)
                        .map(user => fetchUserSummary(String(user?.steamId), user?.mostRecent ?? 0, apiKey))
                );
                // Sort users by last logged in to Steam client - most recent first
                steamUsers.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0));
                setSteamUsers(steamUsers);
                setUserSummaries(steamUsers);
                setIsLoading(false);
            } else {
                // TODO: handle case when no users are found
                setSteamUsers([]);
                setUserSummaries([]);
                setIsLoading(false);
            }
        };
        getSteamUsers();
    }, [userSettings.general?.apiKey, refreshKey]);

    const handleLogin = async (index: number): Promise<void> => {
        try {
            // Make sure Steam is running
            const isSteamRunning = await checkSteamStatus(true);
            if (!isSteamRunning) return;

            setIsLoading(true);
            const userSummary = userSummaries[index];

            // mostRecent !== 1 means this isn't the account that's currently logged in to Steam
            // so show a warning to the user when they log in
            if (userSummaries[index]?.mostRecent !== 1) showAccountMismatchToast('warning');

            // Save selected user to localStorage and context for app-wide access
            localStorage.setItem('userSummary', JSON.stringify(userSummary));

            setUserSummary(userSummary);
            setIsLoading(false);
            logEvent(`[System] Logged in as ${userSummary?.personaName}`);
        } catch (error) {
            setIsLoading(false);
            showDangerToast(t('common.error'));
            console.error('Error in (handleLogin):', error);
            logEvent(`[Error] in (handleLogin): ${error}`);
        }
    };

    return { isLoading, handleLogin, steamUsers };
}
