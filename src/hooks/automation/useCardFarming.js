import { checkDrops, getAllGamesWithDrops, logEvent, startIdle, stopIdle, formatTime } from '@/src/utils/utils';

export const useCardFarming = async (
    setIsComplete,
    setTotalDropsRemaining,
    setGamesWithDrops,
    setCountdownTimer,
    isMountedRef,
    abortControllerRef
) => {
    const startCardFarming = async () => {
        try {
            const { totalDrops, gamesSet } = await checkGamesForDrops();

            setTotalDropsRemaining(totalDrops);
            setGamesWithDrops(gamesSet);

            if (isMountedRef.current && gamesSet.size > 0) {
                await farmCards(gamesSet, setCountdownTimer, isMountedRef, abortControllerRef);
            } else {
                logEvent('[Card Farming] No games left - stopping');
                return setIsComplete(true);
            }

            // Rerun if component is still mounted - needed check if user stops feature during loop
            if (isMountedRef.current) startCardFarming();
        } catch (error) {
            handleError('startCardFarming', error);
        }
    };

    if (isMountedRef.current) startCardFarming();
};

// Check games for drops and return total drops and games set
const checkGamesForDrops = async () => {
    const { cardFarming, steamCookies, userSummary, settings, gameSettings } = getLocalStorageData();
    const { allGames } = settings?.cardFarming;

    const gamesSet = new Set();
    let totalDrops = 0;

    try {
        if (allGames) {
            const gamesWithDrops = await getAllGamesWithDrops(userSummary.steamId, steamCookies.sid, steamCookies.sls, steamCookies?.sma);
            totalDrops = processGamesWithDrops(gamesWithDrops, gamesSet, gameSettings);
        } else {
            totalDrops = await processIndividualGames(cardFarming, gamesSet, gameSettings, userSummary, steamCookies);
        }
    } catch (error) {
        handleError('checkGamesForDrops', error);
    }

    return { totalDrops, gamesSet };
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
        const dropsRemaining = await checkDrops(userSummary.steamId, gameData.appid, steamCookies.sid, steamCookies.sls, steamCookies?.sma);
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

// Farm cards for the games in the set
export const farmCards = async (gamesSet, setCountdownTimer, isMountedRef, abortControllerRef) => {
    try {
        const farmingPromises = Array.from(gamesSet).map(async (game) => {
            const farmingInterval = 60000 * 30;
            const shortDelay = 15000;
            const mediumDelay = 60000;
            const longDelay = 60000 * 5;

            await startAndstopIdle(game.appId, game.name, longDelay, setCountdownTimer, isMountedRef, abortControllerRef);
            await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
            if (await checkDropsRemaining(game)) return;
            await startAndstopIdle(game.appId, game.name, shortDelay, setCountdownTimer, isMountedRef, abortControllerRef);
            if (await checkDropsRemaining(game)) return;
            await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
            if (await checkDropsRemaining(game)) return;
            await startAndstopIdle(game.appId, game.name, farmingInterval, setCountdownTimer, isMountedRef, abortControllerRef);
            await delayAndCountdown(mediumDelay, setCountdownTimer, isMountedRef, abortControllerRef);
            if (await checkDropsRemaining(game)) return;
            await startAndstopIdle(game.appId, game.name, shortDelay, setCountdownTimer, isMountedRef, abortControllerRef);
        });

        await Promise.all(farmingPromises);
    } catch (error) {
        handleError('farmCards', error);
    }
};

// Start and stop idler for a game
const startAndstopIdle = async (appId, name, duration, setCountdownTimer, isMountedRef, abortControllerRef) => {
    try {
        startCountdown(duration / 60000, setCountdownTimer);
        await startIdle(appId, name, true, false);
        await delay(duration, isMountedRef, abortControllerRef);
        await stopIdle(appId, name);
    } catch (error) {
        handleError('startAndstopIdle', error);
    }
};

// Delay and update countdown timer
const delayAndCountdown = async (ms, setCountdownTimer, isMountedRef, abortControllerRef) => {
    startCountdown(ms / 60000, setCountdownTimer);
    await delay(ms, isMountedRef, abortControllerRef);
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

// Start the countdown timer
const startCountdown = (durationInMinutes, setCountdownTimer) => {
    try {
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
    } catch (error) {
        handleError('startCountdown', error);
    }
};

// Remove game from farming list
const removeGameFromFarmingList = (gameId) => {
    try {
        const cardFarming = JSON.parse(localStorage.getItem('cardFarmingListCache')) || [];
        const updatedCardFarming = cardFarming.filter(arr => arr.appid !== gameId);
        localStorage.setItem('cardFarmingListCache', JSON.stringify(updatedCardFarming));
    } catch (error) {
        handleError('removeGameFromFarmingList', error);
    }
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

// Handle cancel action
export const handleCancel = async (gamesWithDrops, isMountedRef, abortControllerRef) => {
    try {
        const stopPromises = Array.from(gamesWithDrops).map(game => stopIdle(game.appId, game.name));
        await Promise.all(stopPromises);
    } catch (error) {
        handleError('handleCancel', error);
    } finally {
        isMountedRef.current = false;
        abortControllerRef.current.abort();
    }
};

const getLocalStorageData = () => {
    return {
        cardFarming: JSON.parse(localStorage.getItem('cardFarmingListCache')) || [],
        steamCookies: JSON.parse(localStorage.getItem('steamCookies')) || {},
        userSummary: JSON.parse(localStorage.getItem('userSummary')) || {},
        settings: JSON.parse(localStorage.getItem('settings')) || {},
        gameSettings: JSON.parse(localStorage.getItem('gameSettings')) || {}
    };
};

// Handle errors
const handleError = (functionName, error) => {
    if (!error) return;
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};