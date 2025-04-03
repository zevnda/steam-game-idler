import { createContext, useContext, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import type { NavigationContextType, ActivePageType, CurrentTabType } from '@/types';

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }): ReactElement => {
    const [activePage, setActivePage] = useState<ActivePageType>('games');
    const [currentTab, setCurrentTab] = useState<CurrentTabType>('achievements');

    return (
        <NavigationContext.Provider value={{
            activePage, setActivePage,
            currentTab, setCurrentTab,
        }}>
            {children}
        </NavigationContext.Provider>
    );
};

export function useNavigationContext(): NavigationContextType {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigationContext must be used within a NavigationProvider');
    }
    return context;
}