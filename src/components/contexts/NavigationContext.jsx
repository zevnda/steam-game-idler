import { createContext, useState } from 'react';

export const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
    const [activePage, setActivePage] = useState('games');
    const [currentTab, setCurrentTab] = useState(null);

    return (
        <NavigationContext.Provider value={{
            activePage, setActivePage,
            currentTab, setCurrentTab,
        }}>
            {children}
        </NavigationContext.Provider>
    );
};