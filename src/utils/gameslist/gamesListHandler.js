import { invoke } from '@tauri-apps/api/core';

// Fetches the games list and recent games from cache or API
export const fetchGamesList = async (steamId, refreshKey, prevRefreshKey) => {
    const cachedGamesListFiles = await invoke('get_games_list_cache', { steamId });
    const cachedGamesList = cachedGamesListFiles?.games_list?.games;
    const cachedRecentGamesList = cachedGamesListFiles?.recent_games?.games;

    // TODO: remove `!cachedGamesListFiles.games_list.response` from condition
    // once all users have migrated to the new format
    if (cachedGamesList && !cachedGamesListFiles.games_list.response && refreshKey === prevRefreshKey) {
        return { gamesList: cachedGamesList || [], recentGamesList: cachedRecentGamesList || [] };
    } else {
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
            sortedAndFilteredGames.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'z-a':
            sortedAndFilteredGames.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case '1-0':
            sortedAndFilteredGames.sort((a, b) => b.playtime_forever - a.playtime_forever);
            break;
        case '0-1':
            sortedAndFilteredGames.sort((a, b) => a.playtime_forever - b.playtime_forever);
            break;
        case 'recent':
            sortedAndFilteredGames = recentGames;
            break;
        default:
            break;
    }
    if (isQuery && gameQueryValue.trim()) {
        sortedAndFilteredGames = sortedAndFilteredGames.filter(item =>
            item.name.toLowerCase().includes(gameQueryValue.toLowerCase().trim())
        );
    }
    return sortedAndFilteredGames;
};