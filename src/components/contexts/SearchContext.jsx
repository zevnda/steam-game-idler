import { createContext, useState } from 'react';

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [isQuery, setIsQuery] = useState(false);
    const [gameQueryValue, setGameQueryValue] = useState('');
    const [achievementQueryValue, setAchievementQueryValue] = useState('');

    return (
        <SearchContext.Provider value={{
            isQuery, setIsQuery,
            gameQueryValue, setGameQueryValue,
            achievementQueryValue, setAchievementQueryValue,
        }}>
            {children}
        </SearchContext.Provider>
    );
};