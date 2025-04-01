import { createContext, useContext, useState } from 'react';
import type { Dispatch, JSX, ReactNode, SetStateAction } from 'react';

interface UpdateContextType {
    updateAvailable: boolean;
    setUpdateAvailable: Dispatch<SetStateAction<boolean>>;
    showChangelog: boolean;
    setShowChangelog: Dispatch<SetStateAction<boolean>>;
}

export const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    return (
        <UpdateContext.Provider value={{
            updateAvailable, setUpdateAvailable,
            showChangelog, setShowChangelog,
        }}>
            {children}
        </UpdateContext.Provider>
    );
};

export function useUpdateContext(): UpdateContextType {
    const context = useContext(UpdateContext);
    if (context === undefined) {
        throw new Error('useUpdateContext must be used within an UpdateProvider');
    }
    return context;
}