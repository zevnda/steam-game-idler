import { createContext, useContext, useState } from 'react';
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';

import type { Game } from '@/types';

interface IdleContextType {
    idleGamesList: Game[];
    setIdleGamesList: Dispatch<SetStateAction<Game[]>>;
}

export const IdleContext = createContext<IdleContextType | undefined>(undefined);

export const IdleProvider = ({ children }: { children: ReactNode }): ReactElement => {
    const [idleGamesList, setIdleGamesList] = useState<Game[]>([]);

    return (
        <IdleContext.Provider value={{
            idleGamesList, setIdleGamesList
        }}>
            {children}
        </IdleContext.Provider>
    );
};

export function useIdleContext(): IdleContextType {
    const context = useContext(IdleContext);
    if (context === undefined) {
        throw new Error('useIdleContext must be used within an IdleProvider');
    }
    return context;
}