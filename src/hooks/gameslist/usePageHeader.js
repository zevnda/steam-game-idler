import { useState, useEffect, useContext } from 'react';

import { toast } from 'react-toastify';
import moment from 'moment';

import { AppContext } from '@/src/components/layout/AppContext';
import { logEvent } from '@/src/utils/utils';

export const usePageHeader = ({ setSortStyle, setRefreshKey }) => {
    const { userSummary } = useContext(AppContext);
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
            if (userSummary.steamId !== '76561198158912649' && userSummary.steamId !== '76561198999797359') {
                const cooldown = sessionStorage.getItem('cooldown');
                if (cooldown && moment().unix() < cooldown) {
                    return toast.info(`Games can be refreshed again at ${moment.unix(cooldown).format('h:mm A')}`);
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