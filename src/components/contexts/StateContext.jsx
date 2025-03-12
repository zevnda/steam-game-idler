import { createContext, useState } from 'react';

export const StateContext = createContext();

export const StateProvider = ({ children }) => {
    const [appId, setAppId] = useState(null);
    const [appName, setAppName] = useState(null);
    const [showFreeGamesTab, setShowFreeGamesTab] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [isCardFarming, setIsCardFarming] = useState(false);
    const [isAchievementUnlocker, setIsAchievementUnlocker] = useState(false);

    return (
        <StateContext.Provider value={{
            showFreeGamesTab, setShowFreeGamesTab,
            appId, setAppId,
            appName, setAppName,
            showAchievements, setShowAchievements,
            isCardFarming, setIsCardFarming,
            isAchievementUnlocker, setIsAchievementUnlocker,
        }}>
            {children}
        </StateContext.Provider>
    );
};