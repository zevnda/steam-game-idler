import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import moment from 'moment';
import { useState, useEffect } from 'react';

import { logEvent } from '@/utils/global/tasks';

export const usePageHeader = ({ setSortStyle, setRefreshKey }) => {
    const [sortStyle, setSortStyleState] = useState(localStorage.getItem('sortStyle') || 'a-z');

    useEffect(() => {
        setSortStyle(sortStyle);
    }, [sortStyle, setSortStyle]);

    const handleSorting = (e) => {
        try {
            localStorage.setItem('sortStyle', e.currentKey);
            setSortStyleState(e.currentKey);
        } catch (error) {
            addToast({ description: `Error in (handleSorting): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleSorting):', error);
            logEvent(`[Error] in (handleSorting): ${error}`);
        }
    };

    const handleRefetch = async (steamId) => {
        try {
            if (steamId !== '76561198158912649' && steamId !== '76561198999797359') {
                const cooldown = sessionStorage.getItem('cooldown');
                if (cooldown && moment().unix() < cooldown) {
                    return addToast({ description: `Games can be refreshed again at ${moment.unix(cooldown).format('h:mm A')}`, color: 'primary' });
                }
            }
            await invoke('delete_user_games_list_files', { steamId });
            sessionStorage.setItem('cooldown', moment().add(30, 'minutes').unix());
            setRefreshKey(prevKey => prevKey + 1);
        } catch (error) {
            addToast({ description: `Error in (handleRefetch): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleRefetch):', error);
            logEvent(`[Error] in (handleRefetch): ${error}`);
        }
    };

    return { sortStyle, handleSorting, handleRefetch };
};