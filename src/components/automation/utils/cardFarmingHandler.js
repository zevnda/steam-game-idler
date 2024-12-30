import { checkDrops, getAllGamesWithDrops, logEvent, startIdler, stopIdler, formatTime } from '@/src/utils/utils';

// Check games for drops and return total drops and games set
export const checkGamesForDrops = async () => {
    const { cardFarming, steamCookies, userSummary, settings, gameSettings } = getLocalStorageData();
    const gameDataArr = cardFarming.map(game => JSON.parse(game));
    const gamesSet = new Set();
    let totalDrops = 0;

    try {
        if (settings.cardFarming.allGames) {
            const gamesWithDrops = await getAllGamesWithDrops(userSummary.steamId, steamCookies.sid, steamCookies.sls);
            totalDrops = processGamesWithDrops(gamesWithDrops, gamesSet, gameSettings);
        } else {
            totalDrops = await processIndividualGames(gameDataArr, gamesSet, gameSettings, userSummary, steamCookies);
        }
    } catch (error) {
        handleError('checkGamesForDrops', error);
    }

    return { totalDrops, gamesSet };
};

// Farm cards for the games in the set
export const farmCards = async (gamesSet, setCountdownTimer, isMountedRef, abortControllerRef) => {
    const farmingPromises = Array.from(gamesSet).map(game =>
        farmGame(game, setCountdownTimer, isMountedRef, abortControllerRef)
    );
    await Promise.all(farmingPromises);
};

// Function for farming a game's cards
const farmGame = async (game, setCountdownTimer, isMountedRef, abortControllerRef) => {
    // const farmingInterval = 60000 * 30;
    // const shortDelay = 15000;
    // const mediumDelay = 60000;
    // const longDelay = 60000 * 5;

    const farmingInterval = 20000;
    const shortDelay = 5000;
    const mediumDelay = 10000;
    const longDelay = 15000;

    try {
        await startAndStopIdler(game.appId, game.name, longDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        if (await checkDropsRemaining(game)) return;
        await startAndStopIdler(game.appId, game.name, shortDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        if (await checkDropsRemaining(game)) return;
        await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        if (await checkDropsRemaining(game)) return;
        await startAndStopIdler(game.appId, game.name, farmingInterval, setCountdownTimer, isMountedRef, abortControllerRef);
        await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        if (await checkDropsRemaining(game)) return;
        await startAndStopIdler(game.appId, game.name, shortDelay, setCountdownTimer, isMountedRef, abortControllerRef);
    } catch (error) {
        handleError('farmGame', error);
    }
};

// Check if there are still drops remaining for the game
const checkDropsRemaining = async (game) => {
    const { steamCookies, userSummary } = getLocalStorageData();
    const dropsRemaining = await checkDrops(userSummary.steamId, game.appId, steamCookies.sid, steamCookies.sls);

    if (dropsRemaining <= 0) {
        removeGameFromFarmingList(game.appId);
        logEvent(`[Card Farming] Farmed all drops for ${game.name} - removed from list`);
        return true;
    }

    if (game.initialDrops - dropsRemaining >= game.dropsToCount) {
        removeGameFromFarmingList(game.appId);
        logEvent(`[Card Farming- maxCardDrops] Farmed ${game.initialDrops - dropsRemaining}/${dropsRemaining} cards for ${game.name} - removed from list`);
        return true;
    }

    return false;
};

// Start and stop idler for a game
const startAndStopIdler = async (appId, name, duration, setCountdownTimer, isMountedRef, abortControllerRef) => {
    try {
        startCountdown(duration / 60000, setCountdownTimer);
        await startIdler(appId, name, true, false);
        await delay(duration, isMountedRef, abortControllerRef);
        await stopIdler(appId, name);
    } catch (error) {
        handleError('startAndStopIdler', error);
    }
};

// Delay and update countdown timer
const delayAndCountdown = async (ms, setCountdownTimer, isMountedRef, abortControllerRef) => {
    startCountdown(ms / 60000, setCountdownTimer);
    await delay(ms, isMountedRef, abortControllerRef);
};

// Start countdown timer
let isTimerSet = false;
const startCountdown = (durationInMinutes, setCountdownTimer) => {
    if (!isTimerSet) {
        console.log('fuckkyyy');
        const durationInMilliseconds = durationInMinutes * 60000;
        let remainingTime = durationInMilliseconds;

        const intervalId = setInterval(() => {
            if (remainingTime <= 0) {
                clearInterval(intervalId);
                isTimerSet = false;
                return;
            }

            isTimerSet = true;
            setCountdownTimer(formatTime(remainingTime));
            remainingTime -= 1000;
        }, 1000);
    }
};
// Remove game from farming list
const removeGameFromFarmingList = (gameId) => {
    try {
        const cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
        const updatedCardFarming = cardFarming.filter(arr => JSON.parse(arr).appid !== gameId);
        localStorage.setItem('cardFarming', JSON.stringify(updatedCardFarming));
    } catch (error) {
        handleError('removeGameFromFarmingList', error);
    }
};

// Handle cancel action
export const handleCancel = async (setActivePage, gamesWithDrops, isMountedRef, abortControllerRef) => {
    setActivePage('games');
    try {
        const stopPromises = Array.from(gamesWithDrops).map(game => stopIdler(game.appId, game.name));
        await Promise.all(stopPromises);
    } catch (error) {
        handleError('handleCancel', error);
    } finally {
        isMountedRef.current = false;
        abortControllerRef.current.abort();
    }
};

// Helper function
const getLocalStorageData = () => {
    return {
        cardFarming: JSON.parse(localStorage.getItem('cardFarming')) || [],
        steamCookies: JSON.parse(localStorage.getItem('steamCookies')) || {},
        userSummary: JSON.parse(localStorage.getItem('userSummary')) || {},
        settings: JSON.parse(localStorage.getItem('settings')) || {},
        gameSettings: JSON.parse(localStorage.getItem('gameSettings')) || {}
    };
};

const processGamesWithDrops = (gamesWithDrops, gamesSet, gameSettings) => {
    let totalDrops = 0;
    if (gamesWithDrops) {
        for (const gameData of gamesWithDrops) {
            if (gamesSet.size < 32) {
                const gameSetting = gameSettings[gameData.id] || {};
                const maxCardDrops = gameSetting?.maxCardDrops || gameData.remaining;
                const dropsToCount = Math.min(gameData.remaining, maxCardDrops);
                gamesSet.add({ appId: gameData.id, name: gameData.name, dropsToCount, initialDrops: gameData.remaining });
                totalDrops += dropsToCount;
                logEvent(`[Card Farming] ${dropsToCount} drops remaining for ${gameData.name} - starting`);
            } else {
                break;
            }
        }
    }
    return totalDrops;
};

const processIndividualGames = async (gameDataArr, gamesSet, gameSettings, userSummary, steamCookies) => {
    let totalDrops = 0;
    const dropCheckPromises = gameDataArr.map(async (gameData) => {
        if (gamesSet.size >= 32) return;
        const dropsRemaining = await checkDrops(userSummary.steamId, gameData.appid, steamCookies.sid, steamCookies.sls);
        if (dropsRemaining > 0) {
            const gameSetting = gameSettings[gameData.appid] || {};
            const maxCardDrops = gameSetting?.maxCardDrops || dropsRemaining;
            const dropsToCount = Math.min(dropsRemaining, maxCardDrops);
            gamesSet.add({ appId: gameData.appid, name: gameData.name, dropsToCount, initialDrops: dropsRemaining });
            totalDrops += dropsToCount;
            logEvent(`[Card Farming] ${dropsToCount} drops remaining for ${gameData.name} - starting`);
        } else {
            logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - removed from list`);
            removeGameFromFarmingList(gameData.appid);
        }
    });
    await Promise.all(dropCheckPromises);
    return totalDrops;
};

// Delay function
const delay = (ms, isMountedRef, abortControllerRef) => {
    return new Promise((resolve, reject) => {
        const checkInterval = 1000;
        let elapsedTime = 0;

        const intervalId = setInterval(() => {
            if (!isMountedRef.current) {
                clearInterval(intervalId);
                reject();
            } else if (elapsedTime >= ms) {
                clearInterval(intervalId);
                resolve();
            }
            elapsedTime += checkInterval;
        }, checkInterval);

        abortControllerRef.current.signal.addEventListener('abort', () => {
            clearInterval(intervalId);
            reject();
        });
    });
};

// Handle errors
const handleError = (functionName, error) => {
    if (!error) return;
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};