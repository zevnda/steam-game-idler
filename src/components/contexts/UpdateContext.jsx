import { createContext, useState } from 'react';

export const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
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