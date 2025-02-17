import { createContext, useContext, useState, useEffect } from 'react';

export const ColorContext = createContext();

export const ColorProvider = ({ children }) => {
    const [themeColor, setThemeColor] = useState("#2c7adb");

    useEffect(() => {
        const storedColor = localStorage.getItem('themeColor');
        if (storedColor) {
            setThemeColor(storedColor);
            const r = parseInt(storedColor.slice(1, 3), 16);
            const g = parseInt(storedColor.slice(3, 5), 16);
            const b = parseInt(storedColor.slice(5, 7), 16);
            document.documentElement.style.setProperty('--dynamic-r', r);
            document.documentElement.style.setProperty('--dynamic-g', g);
            document.documentElement.style.setProperty('--dynamic-b', b);
            updateTextColor(r, g, b);
        }
    }, []);

    const updateColor = (newColor) => {
        const r = parseInt(newColor.slice(1, 3), 16);
        const g = parseInt(newColor.slice(3, 5), 16);
        const b = parseInt(newColor.slice(5, 7), 16);

        setThemeColor(newColor);
        localStorage.setItem('themeColor', newColor);
        document.documentElement.style.setProperty('--dynamic-r', r);
        document.documentElement.style.setProperty('--dynamic-g', g);
        document.documentElement.style.setProperty('--dynamic-b', b);
        updateTextColor(r, g, b);
    };

    const updateTextColor = (r, g, b) => {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = brightness > 128 ? '#000000' : '#ffffff';
        document.documentElement.style.setProperty('--dynamic-text', textColor);
    };

    return (
        <ColorContext.Provider value={{ themeColor, updateColor }}>
            {children}
        </ColorContext.Provider>
    );
}

export const useColor = () => useContext(ColorContext);