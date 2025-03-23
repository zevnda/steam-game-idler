import { invoke } from '@tauri-apps/api/core';
import moment from 'moment';
import { useState, useEffect } from 'react';

import { logEvent } from '@/utils/tasks';
import { showDangerToast, showPrimaryToast } from '@/utils/toasts';

export const usePageHeader = ({ setSortStyle, setRefreshKey }) => {
    // Get saved sort style from localStorage or default to 'a-z'
    const [sortStyle, setSortStyleState] = useState(localStorage.getItem('sortStyle') || 'a-z');

    // Update sort style when state changes
    useEffect(() => {
        setSortStyle(sortStyle);
    }, [sortStyle, setSortStyle]);

    const handleSorting = (e) => {
        try {
            // Save the selected sort style to localStorage and update state
            localStorage.setItem('sortStyle', e.currentKey);
            setSortStyleState(e.currentKey);
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleSorting):', error);
            logEvent(`[Error] in (handleSorting): ${error}`);
        }
    };

    const handleRefetch = async (steamId) => {
        try {
            if (steamId !== '76561198158912649' && steamId !== '76561198999797359') {
                // Check if user is on cooldown for refreshing games
                const cooldown = sessionStorage.getItem('cooldown');
                if (cooldown && moment().unix() < cooldown)
                    return showPrimaryToast(`Games can be refreshed again at ${moment.unix(cooldown).format('h:mm A')}`);
            }

            // Delete cached games list files from backend
            await invoke('delete_user_games_list_files', { steamId });

            // Set a 30 min cooldown for refreshing games
            sessionStorage.setItem('cooldown', moment().add(30, 'minutes').unix());

            // Trigger a refresh by incrementing the refresh key
            setRefreshKey(prevKey => prevKey + 1);
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleRefetch):', error);
            logEvent(`[Error] in (handleRefetch): ${error}`);
        }
    };

    return { sortStyle, handleSorting, handleRefetch };
};