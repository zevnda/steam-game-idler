import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useRef, useContext } from 'react';

import { SearchContext } from '@/components/contexts/SearchContext';
import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast } from '@/utils/toasts';

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

                // Fetch games data, either from cache or API
                const { gamesList, recentGamesList } = await fetchGamesList(userSummary.steamId, refreshKey, previousRefreshKeyRef.current);
                setGamesList(gamesList);
                setRecentGames(recentGamesList);

                // Initialize with first page of games
                setVisibleGames(gamesList.slice(0, gamesPerPage));

                setIsLoading(false);
                previousRefreshKeyRef.current = refreshKey;
            } catch (error) {
                setIsLoading(false);
                showDangerToast('An error occurred. Check the logs for more information');
                console.error('Error in (getGamesList):', error);
                logEvent(`[Error] in (getGamesList): ${error}`);
            }
        };
        getGamesList();
    }, [userSummary.steamId, refreshKey, setGamesList]);

    useEffect(() => {
        if (gamesList && recentGames) {
            // Sort and filter whenever dependencies change
            const sortedAndFilteredGames = sortAndFilterGames(gamesList, recentGames, sortStyle, isQuery, gameQueryValue);
            setFilteredGames(sortedAndFilteredGames);

            // Reset to first page when sort or filter changes
            setVisibleGames(sortedAndFilteredGames.slice(0, gamesPerPage));
            setCurrentPage(1);
        }
    }, [gamesList, recentGames, sortStyle, isQuery, gameQueryValue]);

    useEffect(() => {
        // Clear search input when sort style changes
        setGameQueryValue('');
    }, [sortStyle, setGameQueryValue]);

    useEffect(() => {
        // Aduse infinite scrolling by detecting when user reaches bottom of ref div
        const handleScroll = (event) => {
            try {
                const { scrollTop, scrollHeight, clientHeight } = event.target;
                // Load more games when user scrolls near bottom (within 20px)
                if (scrollTop + clientHeight >= scrollHeight - 20) {
                    const nextPage = currentPage + 1;
                    const startIndex = (nextPage - 1) * gamesPerPage;
                    const endIndex = startIndex + gamesPerPage;
                    const newVisibleGames = filteredGames.slice(0, endIndex);
                    // Only update if we have more games to show
                    if (newVisibleGames.length > visibleGames.length) {
                        setVisibleGames(newVisibleGames);
                        setCurrentPage(nextPage);
                    }
                }
            } catch (error) {
                showDangerToast('An error occurred. Check the logs for more information');
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

// Fetch the games list and recent games from cache or API
export const fetchGamesList = async (steamId, refreshKey, prevRefreshKey) => {
    // Try to get games from cache first
    const cachedGamesListFiles = await invoke('get_games_list_cache', { steamId });
    const cachedGamesList = cachedGamesListFiles?.games_list?.games;
    const cachedRecentGamesList = cachedGamesListFiles?.recent_games?.games;

    // TODO: remove `!cachedGamesListFiles.games_list.response` from condition
    // once all users have migrated to the new format
    // Use cache if available and user hasn't reqested a refresh
    if (cachedGamesList && !cachedGamesListFiles.games_list.response && refreshKey === prevRefreshKey) {
        return { gamesList: cachedGamesList || [], recentGamesList: cachedRecentGamesList || [] };
    } else {
        // Fallback to API if cache isn't available or user requested refresh
        const apiKey = localStorage.getItem('apiKey');
        const gamesListResponse = await invoke('get_games_list', { steamId, apiKey });
        const recentGamesListResponse = await invoke('get_recent_games', { steamId });
        const gamesList = gamesListResponse.games;
        const recentGamesList = recentGamesListResponse.games;
        return { gamesList: gamesList || [], recentGamesList: recentGamesList || [] };
    }
};

// Sort and filter the games list based on sortStyle
export const sortAndFilterGames = (gamesList, recentGames, sortStyle, isQuery, gameQueryValue) => {
    let sortedAndFilteredGames = [...gamesList];
    switch (sortStyle) {
        case 'a-z':
            // Alphabetical sort by game name
            sortedAndFilteredGames.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'z-a':
            // Reverse alphabetical sort by game name
            sortedAndFilteredGames.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case '1-0':
            // Sort by playtime (highest first)
            sortedAndFilteredGames.sort((a, b) => b.playtime_forever - a.playtime_forever);
            break;
        case '0-1':
            // Sort by playtime (lowest first)
            sortedAndFilteredGames.sort((a, b) => a.playtime_forever - b.playtime_forever);
            break;
        case 'recent':
            // Sort by recently played games
            sortedAndFilteredGames = recentGames;
            break;
        default:
            break;
    }
    if (isQuery && gameQueryValue.trim()) {
        // Filter by search term
        sortedAndFilteredGames = sortedAndFilteredGames.filter(item =>
            item.name.toLowerCase().includes(gameQueryValue.toLowerCase().trim())
        );
    }
    return sortedAndFilteredGames;
};