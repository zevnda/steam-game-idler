import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useRef } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { useSearchContext } from '@/components/contexts/SearchContext';
import { useUserContext } from '@/components/contexts/UserContext';
import type { Game } from '@/types/game';
import type { InvokeGamesList } from '@/types/invoke';
import type { SortStyleValue } from '@/types/sort';
import { logEvent } from '@/utils/tasks';
import { showDangerToast } from '@/utils/toasts';

interface GameListResult {
    gamesList: Game[];
    recentGamesList: Game[];
}

interface GamesListHook {
    scrollContainerRef: RefObject<HTMLDivElement>;
    isLoading: boolean;
    gamesList: Game[];
    filteredGames: Game[];
    visibleGames: Game[];
    sortStyle: string;
    setSortStyle: Dispatch<SetStateAction<string>>;
    refreshKey: number;
    setRefreshKey: Dispatch<SetStateAction<number>>;
}

export default function useGamesList(): GamesListHook {
    const { t } = useTranslation();
    const { userSummary, gamesList, setGamesList } = useUserContext();
    const { isQuery, gameQueryValue, setGameQueryValue } = useSearchContext();
    const scrollContainerRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
    const [isLoading, setIsLoading] = useState(true);
    const [recentGames, setRecentGames] = useState<Game[] | null>(null);
    const [sortStyle, setSortStyle] = useState<SortStyleValue>(
        (localStorage.getItem('sortStyle') as SortStyleValue) || '1-0'
    );
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [visibleGames, setVisibleGames] = useState<Game[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const previousRefreshKeyRef = useRef(refreshKey);
    const gamesPerPage: number = 50;

    useEffect(() => {
        const getGamesList = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const sortStyle = localStorage.getItem('sortStyle');
                if (sortStyle) setSortStyle(sortStyle);

                // Fetch games data, either from cache or API
                const { gamesList, recentGamesList } = await fetchGamesList(userSummary?.steamId, refreshKey, previousRefreshKeyRef.current);
                setGamesList(gamesList);
                setRecentGames(recentGamesList);

                // Initialize with first page of games
                setVisibleGames(gamesList.slice(0, gamesPerPage));

                setIsLoading(false);
                previousRefreshKeyRef.current = refreshKey;
            } catch (error) {
                setIsLoading(false);
                showDangerToast(t('common.error'));
                console.error('Error in (getGamesList):', error);
                logEvent(`[Error] in (getGamesList): ${error}`);
            }
        };
        getGamesList();
    }, [userSummary?.steamId, refreshKey, setGamesList, t]);

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
        const handleScroll = (event: Event): void => {
            try {
                const target = event.target as Element;
                const { scrollTop, scrollHeight, clientHeight } = target;
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
                showDangerToast(t('common.error'));
                console.error('Error in (handleScroll):', error);
                logEvent(`[Error] in (handleScroll): ${error}`);
            }
        };

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, [currentPage, visibleGames, filteredGames, t]);

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
export const fetchGamesList = async (
    steamId: string | undefined,
    refreshKey: number,
    prevRefreshKey: number
): Promise<GameListResult> => {
    if (!steamId) return { gamesList: [], recentGamesList: [] };
    // Try to get games from cache first
    const cachedGamesListFiles = await invoke<InvokeGamesList>('get_games_list_cache', { steamId });

    const hasCachedGamesList = cachedGamesListFiles && cachedGamesListFiles.games_list.length > 0;

    const cachedGamesList = cachedGamesListFiles.games_list;
    const cachedRecentGamesList = cachedGamesListFiles.recent_games;

    // Use cache if available and user hasn't reqested a refresh
    if (hasCachedGamesList && refreshKey === prevRefreshKey) {
        return { gamesList: cachedGamesList || [], recentGamesList: cachedRecentGamesList || [] };
    } else {
        // Fallback to API if cache isn't available or user requested refresh
        const apiKey = localStorage.getItem('apiKey');

        const gamesListResponse = await invoke<InvokeGamesList>('get_games_list', { steamId, apiKey });
        const recentGamesListResponse = await invoke<InvokeGamesList>('get_recent_games', { steamId });

        const gamesList = gamesListResponse.games_list;
        const recentGamesList = recentGamesListResponse.games_list;

        return { gamesList: gamesList || [], recentGamesList: recentGamesList || [] };
    }
};

// Sort and filter the games list based on sortStyle
export const sortAndFilterGames = (
    gamesList: Game[],
    recentGames: Game[],
    sortStyle: string,
    isQuery: boolean,
    gameQueryValue: string
): Game[] => {
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
            sortedAndFilteredGames.sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0));
            break;
        case '0-1':
            // Sort by playtime (lowest first)
            sortedAndFilteredGames.sort((a, b) => (a.playtime_forever ?? 0) - (b.playtime_forever ?? 0));
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