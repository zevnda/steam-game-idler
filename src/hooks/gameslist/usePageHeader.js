import { invoke } from '@tauri-apps/api/core';
import moment from 'moment';
import { useState, useEffect } from 'react';

import { logEvent } from '@/utils/global/tasks';
import { showDangerToast, showPrimaryToast } from '@/utils/global/toasts';

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
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleSorting):', error);
            logEvent(`[Error] in (handleSorting): ${error}`);
        }
    };

    const handleRefetch = async (steamId) => {
        try {
            if (steamId !== '76561198158912649' && steamId !== '76561198999797359') {
                const cooldown = sessionStorage.getItem('cooldown');
                if (cooldown && moment().unix() < cooldown)
                    return showPrimaryToast(`Games can be refreshed again at ${moment.unix(cooldown).format('h:mm A')}`);
            }
            await invoke('delete_user_games_list_files', { steamId });
            sessionStorage.setItem('cooldown', moment().add(30, 'minutes').unix());
            setRefreshKey(prevKey => prevKey + 1);
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleRefetch):', error);
            logEvent(`[Error] in (handleRefetch): ${error}`);
        }
    };

    return { sortStyle, handleSorting, handleRefetch };
};