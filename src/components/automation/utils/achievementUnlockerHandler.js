import { formatTime, getRandomDelay, isWithinSchedule, logEvent, startIdler, stopIdler, unlockAchievement } from '@/src/utils/utils';
import { invoke } from '@tauri-apps/api/tauri';

// Start the achievement unlocker process
export const startAchievementUnlocker = async ({
    isMountedRef,
    abortControllerRef,
    setHasPrivateGames,
    setAchievementCount,
    setCurrentGame,
    setGamesWithAchievements,
    setIsComplete,
    setCountdownTimer,
    setIsWaitingForSchedule,
}) => {
    const start = async () => {
        try {
            // Retrieve achievement unlocker and settings from local storage
            const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
            const settings = JSON.parse(localStorage.getItem('settings')) || {};
            let currentGame = null;

            // Check if there are no games left to unlock achievements for
            if (achievementUnlocker.length < 1) {
                logEvent('[Achievement Unlocker - Auto] No games left - stopping');
                if (currentGame) await stopIdler(currentGame.appId, currentGame.name);
                setGamesWithAchievements(0);
                setIsComplete(true);
                return;
            }

            // Fetch achievements for the current game
            const { achievements, game } = await fetchAchievements(achievementUnlocker[0], settings, setCurrentGame, setHasPrivateGames, setAchievementCount, setGamesWithAchievements);
            currentGame = game;

            // Unlock achievements if available, otherwise remove the game from the list
            if (achievements?.length > 0) {
                await unlockAchievements(achievements, settings, currentGame, isMountedRef, setAchievementCount, setCountdownTimer, setIsWaitingForSchedule, abortControllerRef);
            } else {
                removeGameFromUnlockerList(currentGame.appid);
            }

            // Restart the process if the component is still mounted
            if (isMountedRef.current) start();
        } catch (error) {
            handleError('startAchievementUnlocker', error);
        }
    };

    start();
};

// Fetch achievements for a given game
const fetchAchievements = async (gameData, settings, setCurrentGame, setHasPrivateGames, setAchievementCount, setGamesWithAchievements) => {
    const game = JSON.parse(gameData);
    const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
    const maxAchievementUnlocks = getMaxAchievementUnlocks(game.appid);

    try {
        setCurrentGame({ appId: game.appid, name: game.name });

        const apiKey = localStorage.getItem('apiKey');
        const res = await invoke('get_achievement_data', { steamId: userSummary.steamId, appId: game.appid.toString(), apiKey });

        const userAchievements = res?.userAchievements?.playerstats;
        const gameAchievements = res?.percentages?.achievementpercentages?.achievements;
        const gameSchema = res?.schema?.game;

        // Handle private games
        if (!userAchievements) {
            setHasPrivateGames(true);
            return { achievements: [], game };
        }

        // Check if there are no achievements available
        if (!gameAchievements?.length || !gameSchema?.availableGameStats?.achievements?.length) return { achievements: [], game };

        // Filter and sort achievements
        const achievements = userAchievements.achievements
            .filter(achievement => {
                const schemaAchievement = gameSchema.availableGameStats.achievements.find(a => a.name === achievement.apiname);
                return !achievement.achieved && (!settings.achievementUnlocker.hidden || schemaAchievement.hidden === 0);
            })
            .map(achievement => {
                const percentageData = gameAchievements.find(a => a.name === achievement.apiname);
                return {
                    appId: game.appid,
                    name: achievement.apiname,
                    gameName: userAchievements.gameName,
                    percentage: percentageData ? percentageData.percent : null
                };
            })
            .sort((a, b) => b.percentage - a.percentage);

        setAchievementCount(maxAchievementUnlocks || achievements.length);
        setGamesWithAchievements(achievements.length);

        return { achievements, game };
    } catch (error) {
        handleError('fetchAchievements', error);
    }
};

// Unlock achievements
const unlockAchievements = async (achievements, settings, game, isMountedRef, setAchievementCount, setCountdownTimer, setIsWaitingForSchedule, abortControllerRef) => {
    try {
        const { interval, idle, schedule, scheduleFrom, scheduleTo } = settings.achievementUnlocker;
        let isGameIdling = false;

        // Start idling if necessary
        if (idle && schedule && isWithinSchedule(scheduleFrom, scheduleTo)) {
            await startIdler(achievements[0].appId, achievements[0].gameName, false, false);
            isGameIdling = true;
        }

        let achievementsRemaining = achievements.length;
        const maxAchievementUnlocks = getMaxAchievementUnlocks(game.appid);

        // Delay before unlocking the first achievement
        const initialDelay = 15000;
        startCountdown(initialDelay / 60000, setCountdownTimer);
        await delay(initialDelay, isMountedRef, abortControllerRef);

        for (const achievement of achievements) {
            if (isMountedRef.current) {
                // Wait until within schedule if necessary
                if (schedule && !isWithinSchedule(scheduleFrom, scheduleTo)) {
                    if (game) {
                        await stopIdler(game.appid, game.name);
                        isGameIdling = false;
                    }
                    await waitUntilInSchedule(scheduleFrom, scheduleTo, isMountedRef, setIsWaitingForSchedule, abortControllerRef);
                } else if (!isGameIdling && idle) {
                    await startIdler(achievements[0].appId, achievements[0].gameName, false, false);
                    isGameIdling = true;
                }

                if (!isMountedRef.current) break;

                // Skip hidden achievements if necessary
                if (settings.achievementUnlocker.hidden && achievement.hidden) {
                    achievementsRemaining--;
                    setAchievementCount(prevCount => Math.max(prevCount - 1, 0));
                    continue;
                }

                // Unlock the achievement
                await unlockAchievement(achievement.appId, achievement.name, achievement.gameName);
                achievementsRemaining--;
                logEvent(`[Achievement Unlocker - Auto] Unlocked ${achievement.name} for ${achievement.gameName}`);
                setAchievementCount(prevCount => Math.max(prevCount - 1, 0));

                // Stop idling and remove game from list if max achievement unlocks is reached
                if (achievementsRemaining === 0 || (maxAchievementUnlocks && achievementsRemaining <= achievements.length - maxAchievementUnlocks)) {
                    await stopIdler(game.appid, game.name);
                    removeGameFromUnlockerList(game.appid);
                    logEvent(`[Achievement Unlocker - Auto - maxAchievementUnlocks] Unlocked ${achievements.length - maxAchievementUnlocks}/${achievements.length} achievements for ${game.name} - removed from list`);
                    break;
                }

                // Stop idling and remove game from list if all achievements are unlocked
                if (achievementsRemaining === 0) {
                    await stopIdler(game.appid, game.name);
                    removeGameFromUnlockerList(game.appid);
                    break;
                }

                // Wait for a random delay before unlocking the next achievement
                const randomDelay = getRandomDelay(interval[0], interval[1]);
                startCountdown(randomDelay / 60000, setCountdownTimer);
                await delay(randomDelay, isMountedRef, abortControllerRef);
            }
        }
    } catch (error) {
        handleError('unlockAchievements', error);
    }
};

const getMaxAchievementUnlocks = (appId) => {
    const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
    return gameSettings[appId]?.maxAchievementUnlocks || null;
};

// Wait until within the specified schedule
const waitUntilInSchedule = async (scheduleFrom, scheduleTo, isMountedRef, setIsWaitingForSchedule, abortControllerRef) => {
    try {
        setIsWaitingForSchedule(true);
        while (!isWithinSchedule(scheduleFrom, scheduleTo)) {
            if (!isMountedRef.current) {
                setIsWaitingForSchedule(false);
                return;
            }
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    if (!isMountedRef.current) {
                        clearTimeout(timeoutId);
                        reject();
                    } else {
                        resolve();
                    }
                }, 60000);
                abortControllerRef.current.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject();
                });
            });
        }
        setIsWaitingForSchedule(false);
    } catch (error) {
        handleError('waitUntilInSchedule', error);
    }
};

// Remove a game from the unlocker list
const removeGameFromUnlockerList = (gameId) => {
    try {
        const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
        const updatedAchievementUnlocker = achievementUnlocker.filter(arr => JSON.parse(arr).appid !== gameId);
        localStorage.setItem('achievementUnlocker', JSON.stringify(updatedAchievementUnlocker));
    } catch (error) {
        handleError('removeGameFromUnlockerList', error);
    }
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

// Delay execution for a specified amount of time
const delay = (ms, isMountedRef, abortControllerRef) => {
    try {
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
    } catch (error) {
        handleError('delay', error);
    }
};

// Handle cancellation of the achievement unlocker process
export const handleCancel = ({ isMountedRef, abortControllerRef, setActivePage, currentGame }) => {
    isMountedRef.current = false;
    abortControllerRef.current.abort();
    setActivePage('games');
    stopIdler(currentGame.appId, currentGame.name);
};

// Handle errors
const handleError = (functionName, error) => {
    if (!error) return;
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};