import { addToast } from '@heroui/react';
import { useEffect, useState, useRef, useContext } from 'react';

import { SearchContext } from '@/components/contexts/SearchContext';
import { UserContext } from '@/components/contexts/UserContext';
import { fetchGamesList, sortAndFilterGames } from '@/utils/gameslist/gamesListHandler';
import { logEvent } from '@/utils/global/tasks';

export default function useGamesList() {
    const { userSummary, gamesList, setGamesList } = useContext(UserContext);
    const { isQuery, gameQueryValue, setGameQueryValue } = useContext(SearchContext);
    const scrollContainerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentGames, setRecentGames] = useState(null);
    const [sortStyle, setSortStyle] = useState(localStorage.getItem('sortStyle') || 'a-z');
    const [filteredGames, setFilteredGames] = useState([]);
    const [visibleGames, setVisibleGames] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const previousRefreshKeyRef = useRef(refreshKey);
    const gamesPerPage = 50;

    useEffect(() => {
        const getGamesList = async () => {
            try {
                setIsLoading(true);
                const sortStyle = localStorage.getItem('sortStyle');
                if (sortStyle) setSortStyle(sortStyle);
                const { gamesList, recentGamesList } = await fetchGamesList(userSummary.steamId, refreshKey, previousRefreshKeyRef.current);
                setGamesList(gamesList);
                setRecentGames(recentGamesList);
                setVisibleGames(gamesList.slice(0, gamesPerPage));
                setIsLoading(false);
                previousRefreshKeyRef.current = refreshKey;
            } catch (error) {
                setIsLoading(false);
                addToast({ description: `Error in (getGamesList): ${error?.message || error}`, color: 'danger' });
                console.error('Error in (getGamesList):', error);
                logEvent(`[Error] in (getGamesList): ${error}`);
            }
        };
        getGamesList();
    }, [userSummary.steamId, refreshKey, setGamesList]);

    useEffect(() => {
        if (gamesList && recentGames) {
            const sortedAndFilteredGames = sortAndFilterGames(gamesList, recentGames, sortStyle, isQuery, gameQueryValue);
            setFilteredGames(sortedAndFilteredGames);
            setVisibleGames(sortedAndFilteredGames.slice(0, gamesPerPage));
            setCurrentPage(1);
        }
    }, [gamesList, recentGames, sortStyle, isQuery, gameQueryValue]);

    useEffect(() => {
        setGameQueryValue('');
    }, [sortStyle, setGameQueryValue]);

    useEffect(() => {
        const handleScroll = (event) => {
            try {
                const { scrollTop, scrollHeight, clientHeight } = event.target;
                if (scrollTop + clientHeight >= scrollHeight - 20) {
                    const nextPage = currentPage + 1;
                    const startIndex = (nextPage - 1) * gamesPerPage;
                    const endIndex = startIndex + gamesPerPage;
                    const newVisibleGames = filteredGames.slice(0, endIndex);
                    if (newVisibleGames.length > visibleGames.length) {
                        setVisibleGames(newVisibleGames);
                        setCurrentPage(nextPage);
                    }
                }
            } catch (error) {
                addToast({ description: `Error in (handleScroll): ${error?.message || error}`, color: 'danger' });
                console.error('Error in (handleScroll):', error);
                logEvent(`[Error] in (handleScroll): ${error}`);
            }
        };

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, [currentPage, visibleGames, filteredGames]);

    return {
        scrollContainerRef,
        isLoading,
        gamesList,
        filteredGames,
        visibleGames,
        sortStyle,
        setSortStyle,
        refreshKey,
        setRefreshKey,
    };
}
