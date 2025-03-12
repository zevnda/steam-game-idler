import { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userSummary, setUserSummary] = useState(null);
    const [gameList, setGameList] = useState(null);
    const [achievementList, setAchievementList] = useState([]);
    const [statisticsList, setStatisticsList] = useState();
    const [achievementsUnavailable, setAchievementsUnavailable] = useState(false);
    const [statisticsUnavailable, setStatisticsUnavailable] = useState(false);
    const [freeGamesList, setFreeGamesList] = useState([]);

    return (
        <UserContext.Provider value={{
            userSummary, setUserSummary,
            gameList, setGameList,
            achievementList, setAchievementList,
            statisticsList, setStatisticsList,
            achievementsUnavailable, setAchievementsUnavailable,
            statisticsUnavailable, setStatisticsUnavailable,
            freeGamesList, setFreeGamesList,
        }}>
            {children}
        </UserContext.Provider>
    );
};