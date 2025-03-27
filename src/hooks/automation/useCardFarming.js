import { invoke } from '@tauri-apps/api/core';

import { checkDrops, getAllGamesWithDrops } from '@/utils/automation';
import { startFarmIdle, stopFarmIdle } from '@/utils/idle';
import { logEvent } from '@/utils/tasks';

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
                const success = await beginFarmingCycle(gamesSet, isMountedRef, abortControllerRef);
                if (!success) {
                    logEvent('[Card Farming] An error occurred - stopping');
                    return setIsComplete(true);
                }
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
    const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

    const response = await invoke('get_user_settings', { steamId: userSummary.steamId });
    const gameSettings = response.settings.gameSettings;
    const credentials = response.settings.cardFarming.credentials;
    const allGames = response.settings.cardFarming.allGames;

    const cardFarmingList = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: 'cardFarmingList' });

    const gamesSet = new Set();
    let totalDrops = 0;

    try {
        if (allGames) {
            const gamesWithDrops = await getAllGamesWithDrops(userSummary.steamId, credentials.sid, credentials.sls, credentials?.sma);
            totalDrops = processGamesWithDrops(gamesWithDrops, gamesSet, gameSettings);
        } else {
            totalDrops = await processIndividualGames(cardFarmingList.list_data, gamesSet, gameSettings, userSummary, credentials);
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

const processIndividualGames = async (cardFarmingList, gamesSet, gameSettings, userSummary, credentials) => {
    let totalDrops = 0;
    const TIMEOUT = 30000;

    const checkGame = async (gameData) => {
        if (gamesSet.size >= 32) return;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(), TIMEOUT));

        try {
            const dropsRemaining = await Promise.race([
                checkDrops(userSummary.steamId, gameData.appid, credentials.sid, credentials.sls, credentials?.sma),
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
                removeGameFromFarmingList(gameData.appid);
            }
        } catch (error) {
            handleError('checkGame', error);
        }
    };

    await Promise.all(cardFarmingList.map(checkGame));
    return totalDrops;
};

// Begin the cycle of farming for all games in the set
export const beginFarmingCycle = async (gamesSet, isMountedRef, abortControllerRef) => {
    const delays = {
        farming: 60000 * 30,
        short: 15000,
        medium: 60000,
        long: 60000 * 5
    };

    const gamesArray = Array.from(gamesSet);
    let appIds = gamesArray.map(item => parseInt(item.appId));

    if (!isMountedRef.current || appIds.length < 1) return;

    const cycleSteps = [
        { action: startFarmIdle, delay: delays.long },
        { action: stopFarmIdle, delay: delays.medium },
        { action: startFarmIdle, delay: delays.short },
        { action: stopFarmIdle, delay: delays.medium },
        { action: startFarmIdle, delay: delays.farming },
        { action: stopFarmIdle, delay: delays.medium },
        { action: startFarmIdle, delay: delays.short },
        { action: stopFarmIdle, delay: delays.medium }
    ];

    try {
        for (const step of cycleSteps) {
            if (!isMountedRef.current) return;
            const success = await step.action(appIds);
            if (success) {
                await delay(step.delay, isMountedRef, abortControllerRef);
                if (step.action === stopFarmIdle) {
                    appIds = await checkDropsRemaining(gamesSet, appIds);
                }
            } else {
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Error in (beginFarmingCycle) - \'undefined\' can be ignored', error);
        await stopFarmIdle(appIds);
        return false;
    }
};

// Periodically check if there are still drops remaining for each game
const checkDropsRemaining = async (gameSet, appIds) => {
    const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

    let filteredAppIds = [...appIds];
    const gameArray = Array.from(gameSet);

    const checkDropsPromises = gameArray.map(async (game) => {
        try {
            const response = await invoke('get_user_settings', { steamId: userSummary.steamId });
            const credentials = response.settings.cardFarming.credentials;

            const dropsRemaining = await checkDrops(userSummary.steamId, game.appId, credentials.sid, credentials.sls, credentials?.sma);

            if (dropsRemaining <= 0) {
                removeGameFromFarmingList(game.appId);
                filteredAppIds = filteredAppIds.filter(id => id !== parseInt(game.appId));
                logEvent(`[Card Farming] Farmed all drops for ${game.name} - removed from list`);
            }

            if (game.initialDrops - dropsRemaining >= game.dropsToCount) {
                removeGameFromFarmingList(game.appId);
                filteredAppIds = filteredAppIds.filter(id => id !== parseInt(game.appId));
                logEvent(`[Card Farming- maxCardDrops] Farmed ${game.initialDrops - dropsRemaining}/${dropsRemaining} cards for ${game.name} - removed from list`);
            }
        } catch (error) {
            handleError('checkDropsRemaining', error);
        }
    });

    await Promise.all(checkDropsPromises);

    return filteredAppIds;
};

// Remove game from farming list
const removeGameFromFarmingList = async (gameId) => {
    try {
        const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

        const cardFarmingList = await invoke('get_custom_lists', {
            steamId: userSummary.steamId,
            list: 'cardFarmingList'
        });
        const updatedCardFarming = cardFarmingList.list_data.filter(arr => arr.appid !== gameId);
        await invoke('update_custom_list', {
            steamId: userSummary.steamId,
            list: 'cardFarmingList',
            newList: updatedCardFarming
        });
    } catch (error) {
        handleError('removeGameFromFarmingList', error);
    }
};

// Delay function
const delay = (ms, isMountedRef, abortControllerRef) => {
    return new Promise((resolve, reject) => {
        if (!isMountedRef.current) {
            return reject();
        }

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

        const abortHandler = () => {
            clearInterval(intervalId);
            reject();
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
        const gamesArray = Array.from(gamesWithDrops);
        const appIds = gamesArray.map(item => parseInt(item.appId));
        await stopFarmIdle(appIds);
    } catch (error) {
        handleError('handleCancel', error);
    } finally {
        isMountedRef.current = false;
        abortControllerRef.current.abort();
    }
};

// Handle errors
const handleError = (functionName, error) => {
    if (!error) return;
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};