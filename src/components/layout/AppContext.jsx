import { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [userSummary, setUserSummary] = useState(null);
    const [gameList, setGameList] = useState(null);
    const [appId, setAppId] = useState(null);
    const [appName, setAppName] = useState(null);
    const [activePage, setActivePage] = useState('games');
    const [currentTab, setCurrentTab] = useState(null);
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
    const [isCardFarming, setIsCardFarming] = useState(false);
    const [isAchievementUnlocker, setIsAchievementUnlocker] = useState(false);
    const [showChangelogModal, setShowChangelogModal] = useState(false);

    return (
        <AppContext.Provider value={{
            userSummary, setUserSummary,
            gameList, setGameList,
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
            isCardFarming, setIsCardFarming,
            isAchievementUnlocker, setIsAchievementUnlocker,
            showChangelogModal, setShowChangelogModal
        }}>
            {children}
        </AppContext.Provider>
    );
};