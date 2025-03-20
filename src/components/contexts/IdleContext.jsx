import { createContext, useState } from 'react';

export const IdleContext = createContext();

export const IdleProvider = ({ children }) => {
    const [idleGamesList, setIdleGamesList] = useState([]);

    return (
        <IdleContext.Provider value={{
            idleGamesList, setIdleGamesList
        }}>
            {children}
        </IdleContext.Provider>
    );
};