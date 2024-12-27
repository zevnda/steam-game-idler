import React, { createContext, useState, useRef } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [userSummary, setUserSummary] = useState(null);
    const [appId, setAppId] = useState(null);
    const [appName, setAppName] = useState(null);
    const [activePage, setActivePage] = useState('games');
    const [currentTab, setCurrentTab] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [cardFarming, setCardFarming] = useState([]);
    const [achievementUnlocker, setAchievementUnlocker] = useState([]);
    const [autoIdle, setAutoIdle] = useState([]);
    const [showFreeGamesTab, setShowFreeGamesTab] = useState(false);
    const [freeGamesList, setFreeGamesList] = useState([]);
    const [achievementList, setAchievementList] = useState([]);
    const [statisticsList, setStatisticsList] = useState();
    const [showAchievements, setShowAchievements] = useState(false);
    const [isQuery, setIsQuery] = useState(false);
    const [gameQueryValue, setGameQueryValue] = useState('');
    const [achievementQueryValue, setAchievementQueryValue] = useState('');
    const [achievementsUnavailable, setAchievementsUnavailable] = useState(false);
    const [statisticsUnavailable, setStatisticsUnavailable] = useState(false);
    const [gamesWithDrops, setGamesWithDrops] = useState(new Set());
    const [currentGame, setCurrentGame] = useState('');
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());

    return (
        <AppContext.Provider value={{
            userSummary, setUserSummary,
            showFreeGamesTab, setShowFreeGamesTab,
            freeGamesList, setFreeGamesList,
            appId, setAppId,
            appName, setAppName,
            activePage, setActivePage,
            achievementList, setAchievementList,
            statisticsList, setStatisticsList,
            showAchievements, setShowAchievements,
            isQuery, setIsQuery,
            gameQueryValue, setGameQueryValue,
            achievementQueryValue, setAchievementQueryValue,
            achievementsUnavailable, setAchievementsUnavailable,
            statisticsUnavailable, setStatisticsUnavailable,
            currentTab, setCurrentTab,
            favorites, setFavorites,
            cardFarming, setCardFarming,
            achievementUnlocker, setAchievementUnlocker,
            autoIdle, setAutoIdle,
            gamesWithDrops, setGamesWithDrops,
            currentGame, setCurrentGame,
            isMountedRef, abortControllerRef,
        }}>
            {children}
        </AppContext.Provider>
    );
};