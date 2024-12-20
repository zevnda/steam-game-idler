import { useEffect, useState, useRef } from 'react';
import { fetchGamesList, sortAndFilterGames, fetchLocalStorageLists } from '../utils/gamesListHandler';
import { logEvent } from '@/src/utils/utils';
import { toast } from 'react-toastify';

export default function useGamesList(steamId, inputValue, isQuery) {
    const scrollContainerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [gameList, setGameList] = useState(null);
    const [recentGames, setRecentGames] = useState(null);
    const [sortStyle, setSortStyle] = useState(localStorage.getItem('sortStyle') || 'a-z');
    const [favorites, setFavorites] = useState([]);
    const [cardFarming, setCardFarming] = useState([]);
    const [autoIdle, setAutoIdle] = useState([]);
    const [achievementUnlocker, setAchievementUnlocker] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);
    const [visibleGames, setVisibleGames] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const gamesPerPage = 50;

    useEffect(() => {
        const getGamesList = async () => {
            try {
                setIsLoading(true);
                const sortStyle = localStorage.getItem('sortStyle');
                if (sortStyle) setSortStyle(sortStyle);
                const { gameList, recentGames } = await fetchGamesList(steamId);
                setGameList(gameList);
                setRecentGames(recentGames);
                setVisibleGames(gameList.slice(0, gamesPerPage));
                setIsLoading(false);
            } catch (error) {
                setIsLoading(false);
                toast.error(`Error in (getGamesList): ${error?.message || error}`);
                console.error('Error in (getGamesList):', error);
                logEvent(`[Error] in (getGamesList): ${error}`);
            }
        };
        getGamesList();
    }, [steamId, refreshKey]);

    useEffect(() => {
        if (gameList) {
            const sortedAndFilteredGames = sortAndFilterGames(gameList, recentGames, sortStyle, isQuery, inputValue, favorites, cardFarming, achievementUnlocker, autoIdle, setIsLoading);
            setFilteredGames(sortedAndFilteredGames);
            setVisibleGames(sortedAndFilteredGames.slice(0, gamesPerPage));
            setCurrentPage(1);
        }
    }, [gameList, recentGames, favorites, cardFarming, achievementUnlocker, autoIdle, sortStyle, isQuery, inputValue]);

    useEffect(() => {
        try {
            const { favorites, cardFarming, achievementUnlocker, autoIdle } = fetchLocalStorageLists();
            setFavorites(favorites.map(JSON.parse));
            setCardFarming(cardFarming.map(JSON.parse));
            setAchievementUnlocker(achievementUnlocker.map(JSON.parse));
            setAutoIdle(autoIdle.map(JSON.parse));
        } catch (error) {
            toast.error(`Error getting list: ${error?.message || error}`);
            console.error('Error getting lists:', error);
            logEvent(`[Error] getting lists: ${error}`);
        }
    }, []);

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
                toast.error(`Error in (handleScroll): ${error?.message || error}`);
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
        gameList,
        filteredGames,
        visibleGames,
        favorites,
        cardFarming,
        autoIdle,
        achievementUnlocker,
        sortStyle,
        setSortStyle,
        setFavorites,
        setCardFarming,
        setAutoIdle,
        setAchievementUnlocker,
        refreshKey,
        setRefreshKey,
    };
}
