import { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userSummary, setUserSummary] = useState(null);
    const [userSettings, setUserSettings] = useState({});
    const [gamesList, setGamesList] = useState(null);
    const [achievementsUnavailable, setAchievementsUnavailable] = useState(true);
    const [statisticsUnavailable, setStatisticsUnavailable] = useState(true);
    const [freeGamesList, setFreeGamesList] = useState([]);

    return (
        <UserContext.Provider value={{
            userSummary, setUserSummary,
            userSettings, setUserSettings,
            gamesList, setGamesList,
            achievementsUnavailable, setAchievementsUnavailable,
            statisticsUnavailable, setStatisticsUnavailable,
            freeGamesList, setFreeGamesList,
        }}>
            {children}
        </UserContext.Provider>
    );
};