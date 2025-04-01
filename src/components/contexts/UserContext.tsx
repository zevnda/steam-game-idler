import { Time } from '@internationalized/date';
import { createContext, useContext, useState } from 'react';
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';

import type { Game } from '@/types/game';
import type { UserSettings } from '@/types/settings';
import type { UserSummary } from '@/types/user';

interface UserContextType {
    userSummary: UserSummary;
    setUserSummary: Dispatch<SetStateAction<UserSummary>>;
    achievementsUnavailable: boolean;
    setAchievementsUnavailable: Dispatch<SetStateAction<boolean>>;
    statisticsUnavailable: boolean;
    setStatisticsUnavailable: Dispatch<SetStateAction<boolean>>;
    gamesList: Game[];
    setGamesList: Dispatch<SetStateAction<Game[]>>;
    freeGamesList: Game[];
    setFreeGamesList: Dispatch<SetStateAction<Game[]>>;
    userSettings: UserSettings;
    setUserSettings: Dispatch<SetStateAction<UserSettings>>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }): ReactElement => {
    const [userSummary, setUserSummary] = useState<UserSummary>(null);
    const [achievementsUnavailable, setAchievementsUnavailable] = useState(true);
    const [statisticsUnavailable, setStatisticsUnavailable] = useState(true);
    const [gamesList, setGamesList] = useState<Game[]>([]);
    const [freeGamesList, setFreeGamesList] = useState<Game[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({
        gameSettings: null,
        general: {
            antiAway: false,
            freeGameNotifications: true,
            apiKey: null
        },
        cardFarming: {
            listGames: true,
            allGames: false,
            credentials: null,
            userSummary: null
        },
        achievementUnlocker: {
            idle: true,
            hidden: false,
            schedule: false,
            scheduleFrom: new Time(8, 30, 0, 0),
            scheduleTo: new Time(23, 0, 0, 0),
            interval: [
                30,
                130
            ]
        }
    });

    return (
        <UserContext.Provider value={{
            userSummary, setUserSummary,
            gamesList, setGamesList,
            achievementsUnavailable, setAchievementsUnavailable,
            statisticsUnavailable, setStatisticsUnavailable,
            freeGamesList, setFreeGamesList,
            userSettings, setUserSettings,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export function useUserContext(): UserContextType {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}