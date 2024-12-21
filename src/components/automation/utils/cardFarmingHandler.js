import { checkDrops, getAllGamesWithDrops, logEvent, startIdler, stopIdler, formatTime } from '@/src/utils/utils';

// Check games for drops and return total drops and games set
export const checkGamesForDrops = async () => {
    const cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
    const steamCookies = JSON.parse(localStorage.getItem('steamCookies')) || {};
    const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
    const settings = JSON.parse(localStorage.getItem('settings')) || {};

    const gameDataArr = cardFarming.map(game => JSON.parse(game));
    const gamesSet = new Set();
    let totalDrops = 0;

    try {
        if (settings.cardFarming.allGames) {
            // Get all games with drops if the setting is enabled
            const gamesWithDrops = await getAllGamesWithDrops(userSummary.steamId, steamCookies.sid, steamCookies.sls);
            if (gamesWithDrops) {
                for (const gameData of gamesWithDrops) {
                    if (gamesSet.size < 32) {
                        gamesSet.add({ appId: gameData.id, name: gameData.name });
                        totalDrops += gameData.remaining;
                        logEvent(`[Card Farming] ${gameData.remaining} drops remaining for ${gameData.name} - starting`);
                    } else {
                        break;
                    }
                }
            }
        } else {
            // Check drops for each game in the farming list
            const dropCheckPromises = gameDataArr.map(async (gameData) => {
                if (gamesSet.size >= 32) return;
                const dropsRemaining = await checkDrops(userSummary.steamId, gameData.appid, steamCookies.sid, steamCookies.sls);
                if (dropsRemaining > 0) {
                    // Add game to farming list if drops remaining
                    gamesSet.add({ appId: gameData.appid, name: gameData.name });
                    totalDrops += dropsRemaining;
                    logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - starting`);
                } else {
                    // Remove game from farming list if no drops remaining
                    console.log('should remove');
                    logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - removed from list`);
                    removeGameFromFarmingList(gameData.appid);
                }
            });
            await Promise.all(dropCheckPromises);
        }
    } catch (error) {
        handleError('checkGamesForDrops', error);
    }

    return { totalDrops, gamesSet };
};

// Farm cards for the games in the set
export const farmCards = async (gamesSet, setCountdownTimer, isMountedRef, abortControllerRef) => {
    const farmingPromises = Array.from(gamesSet).map(game => farmGame(game, setCountdownTimer, isMountedRef, abortControllerRef));
    await Promise.all(farmingPromises);
};

// Function for farming a game's cards
const farmGame = async (game, setCountdownTimer, isMountedRef, abortControllerRef) => {
    const farmingInterval = 60000 * 30;
    const shortDelay = 15000;
    const mediumDelay = 60000;
    const longDelay = 60000 * 5;

    try {
        await startAndStopIdler(game.appId, game.name, longDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        await startAndStopIdler(game.appId, game.name, shortDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        await startAndStopIdler(game.appId, game.name, farmingInterval, setCountdownTimer, isMountedRef, abortControllerRef);
        await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        await startAndStopIdler(game.appId, game.name, shortDelay, setCountdownTimer, isMountedRef, abortControllerRef);
    } catch (error) {
        handleError('farmGame', error);
    }
};

// Start and stop idler for a game
const startAndStopIdler = async (appId, name, duration, setCountdownTimer, isMountedRef, abortControllerRef) => {
    try {
        startCountdown(duration / 60000, setCountdownTimer);
        startIdler(appId, name, true);
        await delay(duration, isMountedRef, abortControllerRef);
        stopIdler(appId, name);
    } catch (error) {
        handleError('startAndStopIdler', error);
    }
};

// Delay and update countdown timer
const delayAndCountdown = async (ms, setCountdownTimer, isMountedRef, abortControllerRef) => {
    startCountdown(ms / 60000, setCountdownTimer);
    await delay(ms, isMountedRef, abortControllerRef);
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

// Start countdown timer
const startCountdown = (durationInMinutes, setCountdownTimer) => {
    const durationInMilliseconds = durationInMinutes * 60000;
    let remainingTime = durationInMilliseconds;

    const intervalId = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(intervalId);
            return;
        }

        setCountdownTimer(formatTime(remainingTime));
        remainingTime -= 1000;
    }, 1000);
};

// Remove game from farming list
const removeGameFromFarmingList = (gameId) => {
    console.log(gameId);
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

// Handle errors
const handleError = (functionName, error) => {
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};
