import { checkDrops, getAllGamesWithDrops, logEvent, startIdle, stopIdle } from '@/src/utils/utils';

export const useCardFarming = async (
    setIsComplete,
    setTotalDropsRemaining,
    setGamesWithDrops,
    isMountedRef,
    abortControllerRef
) => {
    const cleanup = () => {
        isMountedRef.current = false;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const startCardFarming = async () => {
        try {
            if (!isMountedRef.current) return;

            const { totalDrops, gamesSet } = await checkGamesForDrops();

            if (!isMountedRef.current) return;

            setTotalDropsRemaining(totalDrops);
            setGamesWithDrops(gamesSet);

            if (isMountedRef.current && gamesSet.size > 0) {
                await farmCards(gamesSet, isMountedRef, abortControllerRef);
            } else {
                logEvent('[Card Farming] No games left - stopping');
                return setIsComplete(true);
            }

            if (isMountedRef.current) {
                await startCardFarming();
            }
        } catch (error) {
            handleError('startCardFarming', error);
        }
    };

    if (isMountedRef.current) {
        startCardFarming().catch(error => handleError('useCardFarming', error));
    }

    return cleanup;
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
    const TIMEOUT = 30000;

    const checkGame = async (gameData) => {
        if (gamesSet.size >= 32) return;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), TIMEOUT));

        try {
            const dropsRemaining = await Promise.race([
                checkDrops(userSummary.steamId, gameData.appid, steamCookies.sid, steamCookies.sls, steamCookies?.sma),
                timeoutPromise
            ]);

            if (dropsRemaining > 0) {
                const gameSetting = gameSettings[gameData.appid] || {};
                const maxCardDrops = gameSetting?.maxCardDrops || dropsRemaining;
                const dropsToCount = Math.min(dropsRemaining, maxCardDrops);
                gamesSet.add({
                    appId: gameData.appid,
                    name: gameData.name,
                    dropsToCount,
                    initialDrops: dropsRemaining
                });
                totalDrops += dropsToCount;
                logEvent(`[Card Farming] ${dropsToCount} drops remaining for ${gameData.name} - starting`);
            } else {
                logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - removed from list`);
                await removeGameFromFarmingList(gameData.appid);
            }
        } catch (error) {
            handleError('checkGame', error);
        }
    };

    await Promise.all(gameDataArr.map(checkGame));
    return totalDrops;
};

// Farm cards for the games in the set
export const farmCards = async (gamesSet, isMountedRef, abortControllerRef) => {
    const farmingPromises = new Map();

    try {
        for (const game of gamesSet) {
            // Check if cancelled before starting each game
            if (!isMountedRef.current) {
                // Stop any running games before breaking
                const runningPromises = Array.from(farmingPromises.values());
                await Promise.all(runningPromises);
                break;
            }

            const farmingPromise = (async () => {
                const delays = {
                    farming: 60000 * 30,
                    short: 15000,
                    medium: 60000,
                    long: 60000 * 5
                };

                try {
                    // Check mounted state before each operation
                    if (!isMountedRef.current) return;
                    await startAndstopIdle(game.appId, game.name, delays.long, isMountedRef, abortControllerRef);

                    if (!isMountedRef.current) return;
                    await delay(delays.medium, isMountedRef, abortControllerRef);
                    if (!isMountedRef.current || await checkDropsRemaining(game)) return;

                    if (!isMountedRef.current) return;
                    await startAndstopIdle(game.appId, game.name, delays.short, isMountedRef, abortControllerRef);
                    if (!isMountedRef.current || await checkDropsRemaining(game)) return;

                    if (!isMountedRef.current) return;
                    await delay(delays.medium, isMountedRef, abortControllerRef);
                    if (!isMountedRef.current || await checkDropsRemaining(game)) return;

                    if (!isMountedRef.current) return;
                    await startAndstopIdle(game.appId, game.name, delays.farming, isMountedRef, abortControllerRef);
                    if (!isMountedRef.current) return;

                    if (!isMountedRef.current) return;
                    await delay(delays.medium, isMountedRef, abortControllerRef);
                    if (!isMountedRef.current || await checkDropsRemaining(game)) return;

                    if (!isMountedRef.current) return;
                    await startAndstopIdle(game.appId, game.name, delays.short, isMountedRef, abortControllerRef);
                } catch (error) {
                    console.error(`farmCards-${game.name}`, error)
                } finally {
                    // Make sure to stop the game if we're cancelled
                    if (!isMountedRef.current) {
                        await stopIdle(game.appId, game.name).catch(error =>
                            handleError(`farmCards-cleanup-${game.name}`, error)
                        );
                    }
                    farmingPromises.delete(game.appId);
                }
            })();

            farmingPromises.set(game.appId, farmingPromise);
        }

        await Promise.all(farmingPromises.values());
    } catch (error) {
        handleError('farmCards', error);
    }
};

// Start and stop idler for a game
const startAndstopIdle = async (appId, name, duration, isMountedRef, abortControllerRef) => {
    try {
        if (!isMountedRef.current) return;

        await startIdle(appId, name, true, false);

        try {
            await delay(duration, isMountedRef, abortControllerRef);
        } finally {
            if (!isMountedRef.current || duration > 0) {
                await stopIdle(appId, name);
            }
        }
    } catch (error) {
        handleError('startAndstopIdle', error);
        await stopIdle(appId, name);
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
        if (!isMountedRef.current) {
            return reject(new Error('Component unmounted'));
        }

        const checkInterval = 1000;
        let elapsedTime = 0;
        const intervalId = setInterval(() => {
            if (!isMountedRef.current) {
                clearInterval(intervalId);
                reject(new Error('Component unmounted'));
            } else if (elapsedTime >= ms) {
                clearInterval(intervalId);
                resolve();
            }
            elapsedTime += checkInterval;
        }, checkInterval);

        const abortHandler = () => {
            clearInterval(intervalId);
            reject(new Error('Operation aborted'));
        };

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            resolve();
        }, ms);

        abortControllerRef.current.signal.addEventListener('abort', abortHandler);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            abortControllerRef.current.signal.removeEventListener('abort', abortHandler);
        };
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