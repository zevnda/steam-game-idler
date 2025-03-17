import { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userSummary, setUserSummary] = useState(null);
    const [gameList, setGameList] = useState(null);
    const [achievementsUnavailable, setAchievementsUnavailable] = useState(true);
    const [statisticsUnavailable, setStatisticsUnavailable] = useState(true);
    const [freeGamesList, setFreeGamesList] = useState([]);

    return (
        <UserContext.Provider value={{
            userSummary, setUserSummary,
            gameList, setGameList,
            achievementsUnavailable, setAchievementsUnavailable,
            statisticsUnavailable, setStatisticsUnavailable,
            freeGamesList, setFreeGamesList,
        }}>
            {children}
        </UserContext.Provider>
    );
};