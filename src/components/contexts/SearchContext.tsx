import { createContext, useContext, useState } from 'react';
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';

interface SearchContextType {
    isQuery: boolean;
    setIsQuery: Dispatch<SetStateAction<boolean>>;
    gameQueryValue: string;
    setGameQueryValue: Dispatch<SetStateAction<string>>;
    achievementQueryValue: string;
    setAchievementQueryValue: Dispatch<SetStateAction<string>>;
    statisticQueryValue: string;
    setStatisticQueryValue: Dispatch<SetStateAction<string>>;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }): ReactElement => {
    const [isQuery, setIsQuery] = useState(false);
    const [gameQueryValue, setGameQueryValue] = useState('');
    const [achievementQueryValue, setAchievementQueryValue] = useState('');
    const [statisticQueryValue, setStatisticQueryValue] = useState('');

    return (
        <SearchContext.Provider value={{
            isQuery, setIsQuery,
            gameQueryValue, setGameQueryValue,
            achievementQueryValue, setAchievementQueryValue,
            statisticQueryValue, setStatisticQueryValue
        }}>
            {children}
        </SearchContext.Provider>
    );
};

export function useSearchContext(): SearchContextType {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearchContext must be used within a SearchProvider');
    }
    return context;
}