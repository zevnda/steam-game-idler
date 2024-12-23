import { toast } from 'react-toastify';
import { startIdler, logEvent } from '@/src/utils/utils';

export const handleIdle = async (item) => {
    await startIdler(item.appid, item.name);
};

export const viewAchievments = (item, setAppId, setAppName, setShowAchievements, showAchievements) => {
    setAppId(item.appid);
    setAppName(item.name);
    setShowAchievements(!showAchievements);
};

export const viewStorePage = async (item) => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
        try {
            await window.__TAURI__.shell.open(`https://store.steampowered.com/app/${item.appid}`);
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    }
};

export const addToFavorites = (item, setFavorites) => {
    setTimeout(() => {
        try {
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            favorites.push(JSON.stringify(item));
            localStorage.setItem('favorites', JSON.stringify(favorites));
            const newFavorites = (localStorage.getItem('favorites') && JSON.parse(localStorage.getItem('favorites'))) || [];
            toast.success(`${item.name} added to favorites`, { autoClose: true });
            setFavorites(newFavorites.map(JSON.parse));
            logEvent(`[Favorites] Added ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (addToFavorites): ${error?.message || error}`);
            console.error('Error in (addToFavorites):', error);
            logEvent(`[Error] in (addToFavorites): ${error}`);
        }
    }, 500);
};

export const removeFromFavorites = (item, setFavorites) => {
    setTimeout(() => {
        try {
            const favorites = (localStorage.getItem('favorites') && JSON.parse(localStorage.getItem('favorites'))) || [];
            const updatedFavorites = favorites.filter(arr => JSON.parse(arr).appid !== item.appid);
            localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
            const newFavorites = (localStorage.getItem('favorites') && JSON.parse(localStorage.getItem('favorites'))) || [];
            toast.success(`${item.name} removed from favorites`, { autoClose: true });
            setFavorites(newFavorites.map(JSON.parse));
            logEvent(`[Favorites] Removed ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (removeFromFavorites): ${error?.message || error}`);
            console.error('Error in (removeFromFavorites):', error);
            logEvent(`[Error] in (removeFromFavorites): ${error}`);
        }
    }, 500);
};

export const addToCardFarming = (item, setCardFarming) => {
    setTimeout(() => {
        try {
            let cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
            cardFarming.push(JSON.stringify(item));
            localStorage.setItem('cardFarming', JSON.stringify(cardFarming));
            const newCardFarming = (localStorage.getItem('cardFarming') && JSON.parse(localStorage.getItem('cardFarming'))) || [];
            toast.success(`${item.name} added to card farming`, { autoClose: true });
            setCardFarming(newCardFarming.map(JSON.parse));
            logEvent(`[Card Farming] Added ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (addToCardFarming): ${error?.message || error}`);
            console.error('Error in (addToCardFarming):', error);
            logEvent(`[Error] in (addToCardFarming): ${error}`);
        }
    }, 500);
};

export const removeFromCardFarming = (item, setCardFarming) => {
    setTimeout(() => {
        try {
            const cardFarming = (localStorage.getItem('cardFarming') && JSON.parse(localStorage.getItem('cardFarming'))) || [];
            const updatedCardFarming = cardFarming.filter(arr => JSON.parse(arr).appid !== item.appid);
            localStorage.setItem('cardFarming', JSON.stringify(updatedCardFarming));
            const newCardFarming = (localStorage.getItem('cardFarming') && JSON.parse(localStorage.getItem('cardFarming'))) || [];
            toast.success(`${item.name} removed from card farming`, { autoClose: true });
            setCardFarming(newCardFarming.map(JSON.parse));
            logEvent(`[Card Farming] Removed ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (removeFromCardFarming): ${error?.message || error}`);
            console.error('Error in (removeFromCardFarming):', error);
            logEvent(`[Error] in (removeFromCardFarming): ${error}`);
        }
    }, 500);
};

export const addToAchievementUnlocker = (item, setAchievementUnlocker) => {
    setTimeout(() => {
        try {
            let achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
            achievementUnlocker.push(JSON.stringify(item));
            localStorage.setItem('achievementUnlocker', JSON.stringify(achievementUnlocker));
            const newAchievementUnlocker = (localStorage.getItem('achievementUnlocker') && JSON.parse(localStorage.getItem('achievementUnlocker'))) || [];
            toast.success(`${item.name} added to achievement unlocker`, { autoClose: true });
            setAchievementUnlocker(newAchievementUnlocker.map(JSON.parse));
            logEvent(`[Achievement Unlocker] Added ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (addToAchievementUnlocker): ${error?.message || error}`);
            console.error('Error in (addToAchievementUnlocker):', error);
            logEvent(`[Error] in (addToAchievementUnlocker): ${error}`);
        }
    }, 500);
};

export const removeFromAchievementUnlocker = (item, setAchievementUnlocker) => {
    setTimeout(() => {
        try {
            const achievementUnlocker = (localStorage.getItem('achievementUnlocker') && JSON.parse(localStorage.getItem('achievementUnlocker'))) || [];
            const updatedAchievementUnlocker = achievementUnlocker.filter(arr => JSON.parse(arr).appid !== item.appid);
            localStorage.setItem('achievementUnlocker', JSON.stringify(updatedAchievementUnlocker));
            const newAchievementUnlocker = (localStorage.getItem('achievementUnlocker') && JSON.parse(localStorage.getItem('achievementUnlocker'))) || [];
            toast.success(`${item.name} removed from achievement unlocker`, { autoClose: true });
            setAchievementUnlocker(newAchievementUnlocker.map(JSON.parse));
            logEvent(`[Achievement Unlocker] Removed ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (removeFromAchievementUnlocker): ${error?.message || error}`);
            console.error('Error in (removeFromAchievementUnlocker):', error);
            logEvent(`[Error] in (removeFromAchievementUnlocker): ${error}`);
        }
    }, 500);
};

export const addToAutoIdle = (item, setAutoIdle) => {
    setTimeout(() => {
        try {
            let autoIdle = (localStorage.getItem('autoIdle') && JSON.parse(localStorage.getItem('autoIdle'))) || [];
            if (autoIdle.length < 32) {
                autoIdle.push(JSON.stringify(item));
                localStorage.setItem('autoIdle', JSON.stringify(autoIdle));
                const newAutoIdle = (localStorage.getItem('autoIdle') && JSON.parse(localStorage.getItem('autoIdle'))) || [];
                toast.success(`${item.name} added to auto idle`, { autoClose: true });
                setAutoIdle(newAutoIdle.map(JSON.parse));
                logEvent(`[Auto Idle] Added ${item.name} (${item.appid})`);
            } else {
                return toast.error('A max of 32 games can be added to auto idler', { autoClose: true });
            }
        } catch (error) {
            toast.error(`Error in (addToAutoIdle): ${error?.message || error}`);
            console.error('Error in (addToAutoIdle):', error);
            logEvent(`[Error] in (addToAutoIdle): ${error}`);
        }
    }, 500);
};

export const removeFromAutoIdle = (item, setAutoIdle) => {
    setTimeout(() => {
        try {
            const autoIdle = (localStorage.getItem('autoIdle') && JSON.parse(localStorage.getItem('autoIdle'))) || [];
            const updatedAutoIdle = autoIdle.filter(arr => JSON.parse(arr).appid !== item.appid);
            localStorage.setItem('autoIdle', JSON.stringify(updatedAutoIdle));
            const newAutoIdle = (localStorage.getItem('autoIdle') && JSON.parse(localStorage.getItem('autoIdle'))) || [];
            toast.success(`${item.name} removed from auto idle`, { autoClose: true });
            setAutoIdle(newAutoIdle.map(JSON.parse));
            logEvent(`[Auto Idle] Removed ${item.name} (${item.appid})`);
        } catch (error) {
            toast.error(`Error in (removeFromAutoIdle): ${error?.message || error}`);
            console.error('Error in (removeFromAutoIdle):', error);
            logEvent(`[Error] in (removeFromAutoIdle): ${error}`);
        }
    }, 500);
};
