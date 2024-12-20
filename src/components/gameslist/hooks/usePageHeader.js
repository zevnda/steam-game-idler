import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logEvent } from '@/src/utils/utils';
import moment from 'moment';

export const usePageHeader = ({ steamId, setSortStyle, setRefreshKey }) => {
    const [sortStyle, setSortStyleState] = useState(localStorage.getItem('sortStyle') || 'a-z');

    useEffect(() => {
        setSortStyle(sortStyle);
    }, [sortStyle, setSortStyle]);

    const handleSorting = (e) => {
        try {
            localStorage.setItem('sortStyle', e.currentKey);
            setSortStyleState(e.currentKey);
        } catch (error) {
            toast.error(`Error in (handleSorting): ${error?.message || error}`);
            console.error('Error in (handleSorting):', error);
            logEvent(`[Error] in (handleSorting): ${error}`);
        }
    };

    const handleRefetch = () => {
        try {
            if (steamId !== '76561198158912649' && steamId !== '76561198999797359') {
                const cooldown = sessionStorage.getItem('cooldown');
                if (cooldown && moment().unix() < cooldown) {
                    return toast.error(`Games can be refreshed again at ${moment.unix(cooldown).format('h:mm A')}`);
                }
            }
            sessionStorage.removeItem('gamesListCache');
            sessionStorage.setItem('cooldown', moment().add(3, 'minutes').unix());
            setRefreshKey(prevKey => prevKey + 1);
        } catch (error) {
            toast.error(`Error in (handleRefetch): ${error?.message || error}`);
            console.error('Error in (handleRefetch):', error);
            logEvent(`[Error] in (handleRefetch): ${error}`);
        }
    };

    return { sortStyle, handleSorting, handleRefetch };
};
