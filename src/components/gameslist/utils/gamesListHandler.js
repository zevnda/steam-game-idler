import { invoke } from '@tauri-apps/api/tauri';

// Fetches the games list and recent games from cache or API
export const fetchGamesList = async (steamId) => {
    const cachedGameList = sessionStorage.getItem('gamesListCache');
    const cachedRecentGames = sessionStorage.getItem('recentGamesCache');
    if (cachedGameList) {
        const parsedGameList = JSON.parse(cachedGameList);
        const parsedRecentGames = JSON.parse(cachedRecentGames);
        return { gameList: parsedGameList, recentGames: parsedRecentGames };
    } else {
        const apiKey = localStorage.getItem('apiKey');
        const res = await invoke('get_games_list', { steamId, apiKey });
        const resTwo = await invoke('get_recent_games', { steamId });
        const gameList = res.response.games || [];
        const recentGames = resTwo.response.games || [];
        sessionStorage.setItem('gamesListCache', JSON.stringify(gameList));
        sessionStorage.setItem('recentGamesCache', JSON.stringify(recentGames));
        return { gameList, recentGames };
    }
};

// Sort and filter the games list based on sortStyle
export const sortAndFilterGames = (gameList, recentGames, sortStyle, isQuery, gameQueryValue, favorites, cardFarming, achievementUnlocker, autoIdle) => {
    let sortedAndFilteredGames = [...gameList];
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
            sortedAndFilteredGames = recentGames.filter(a => a.name !== 'Spacewar');
            break;
        case 'favorites':
            sortedAndFilteredGames = favorites;
            break;
        case 'cardFarming':
            sortedAndFilteredGames = cardFarming;
            break;
        case 'achievementUnlocker':
            sortedAndFilteredGames = achievementUnlocker;
            break;
        case 'autoIdle':
            sortedAndFilteredGames = autoIdle;
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

// Fetch lists from local storage
export const fetchLocalStorageLists = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
    const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
    const autoIdle = JSON.parse(localStorage.getItem('autoIdle')) || [];
    return { favorites, cardFarming, achievementUnlocker, autoIdle };
};

export const saveCurrentPage = (page) => {
    sessionStorage.setItem('currentPage', page);
};

export const loadCurrentPage = () => {
    const page = sessionStorage.getItem('currentPage');
    return page ? parseInt(page, 10) : 1;
};

export const saveScrollPosition = (position) => {
    sessionStorage.setItem('scrollPosition', position);
};

export const loadScrollPosition = () => {
    const position = sessionStorage.getItem('scrollPosition');
    return position ? parseInt(position, 10) : 0;
};
