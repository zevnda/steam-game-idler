import { formatTime, getRandomDelay, isWithinSchedule, logEvent, startIdle, stopIdle, unlockAchievement } from '@/utils/utils';
import { invoke } from '@tauri-apps/api/tauri';

export const useAchievementUnlocker = async (
    setIsPrivate,
    setCurrentGame,
    setIsComplete,
    setAchievementCount,
    setCountdownTimer,
    setIsWaitingForSchedule,
    isMountedRef,
    abortControllerRef
) => {
    const startAchievementUnlocker = async () => {
        try {
            // Retrieve achievement unlocker and settings from local storage
            const achievementUnlockerGame = JSON.parse(localStorage.getItem('achievementUnlockerListCache')) || [];
            let currentGame = null;

            // Check if there are no games left to unlock achievements for
            if (achievementUnlockerGame.length === 0) {
                logEvent('[Achievement Unlocker] No games left - stopping');
                if (currentGame) await stopIdle(currentGame.appId, currentGame.name);
                setIsComplete(true);
                return;
            }

            // Fetch achievements for the current game
            const { achievements, game, error } = await fetchAchievements(achievementUnlockerGame[0], setIsPrivate, setAchievementCount);

            currentGame = game;
            setCurrentGame(game);

            // If there are achievements available, begin unlocking them
            if (achievements?.length > 0) {
                await unlockAchievements(
                    achievements,
                    game,
                    setAchievementCount,
                    setCountdownTimer,
                    setIsWaitingForSchedule,
                    isMountedRef,
                    abortControllerRef
                );
            } else {
                if (!error) removeGameFromUnlockerList(game.appid);
                logEvent(`[Achievement Unlocker] ${game.name} (${game.appid}) has no achievements remaining - removed`);
            }

            // Rerun if component is still mounted - needed check if user stops feature during loop
            if (isMountedRef.current && !error) startAchievementUnlocker();
        } catch (error) {
            handleError('startAchievementUnlocker', error);
        }
    };

    startAchievementUnlocker();
};

// Fetch achievements for the current game
const fetchAchievements = async (game, setIsPrivate, setAchievementCount) => {
    const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
    const { hidden } = JSON.parse(localStorage.getItem('settings'))?.achievementUnlocker || {};
    const maxAchievementUnlocks = getMaxAchievementUnlocks(game.appid);

    try {
        const apiKey = localStorage.getItem('apiKey');
        const res = await invoke('get_achievement_data', { steamId: userSummary.steamId, appId: game.appid.toString(), apiKey });

        const userAchievements = res?.userAchievements?.playerstats;
        const gameAchievements = res?.percentages?.achievementpercentages?.achievements;
        const gameSchema = res?.schema?.game;

        // Handle private games and games with no achievements
        if (userAchievements.error === 'Profile is not public') {
            setIsPrivate(true);
            return { achievements: [], game, error: true };
        }

        if (userAchievements.error === 'Requested app has no stats') {
            return { achievements: [], game };
        }

        if (!userAchievements || !userAchievements.achievements || userAchievements.achievements === 0) {
            return { achievements: [], game };
        }

        // Handle games with server-side achievements
        const response = await fetch('/server-side-games.json');
        const data = await response.json();
        if (data.some(list => list.appid === game.appid.toString())) {
            logEvent(`[Error] [Achievement Unlocker] ${game.name} (${game.appid}) contains server-side achievements that can't be unlocked`);
            return { achievements: [], game };
        }

        // Filter achievements
        const achievements = userAchievements.achievements
            .filter(achievement => {
                const schemaAchievement = gameSchema.availableGameStats.achievements.find(a => a.name === achievement.apiname);
                return !achievement.achieved && (!hidden || schemaAchievement.hidden === 0);
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

        return { achievements, game };
    } catch (error) {
        handleError('fetchAchievements', error);
    }
};

const unlockAchievements = async (
    achievements,
    game,
    setAchievementCount,
    setCountdownTimer,
    setIsWaitingForSchedule,
    isMountedRef,
    abortControllerRef
) => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings'))?.achievementUnlocker || {};
        const { hidden, interval, idle, schedule, scheduleFrom, scheduleTo } = settings;
        let isGameIdling = false;

        let achievementsRemaining = achievements.length;
        const maxAchievementUnlocks = getMaxAchievementUnlocks(game.appid);

        // Delay before unlocking the first achievement
        const initialDelay = 10000;
        startCountdown(initialDelay / 60000, setCountdownTimer);
        await delay(initialDelay, isMountedRef, abortControllerRef);

        for (const achievement of achievements) {
            if (isMountedRef.current) {
                // Wait until within schedule if necessary
                if (schedule && !isWithinSchedule(scheduleFrom, scheduleTo)) {
                    if (game && isGameIdling) {
                        await stopIdle(game.appid, game.name);
                        isGameIdling = false;
                    }
                    await waitUntilInSchedule(scheduleFrom, scheduleTo, isMountedRef, setIsWaitingForSchedule, abortControllerRef);
                } else if (!isGameIdling && idle) {
                    await startIdle(achievements[0].appId, achievements[0].gameName, false, false);
                    isGameIdling = true;
                }

                if (!isMountedRef.current) break;

                // Skip hidden achievements if necessary
                if (hidden && achievement.hidden) {
                    achievementsRemaining--;
                    setAchievementCount(prevCount => Math.max(prevCount - 1, 0));
                    continue;
                }

                // Unlock the achievement
                await unlockAchievement(achievement.appId, achievement.name, achievement.gameName);
                achievementsRemaining--;
                logEvent(`[Achievement Unlocker] Unlocked ${achievement.name} for ${achievement.gameName}`);
                setAchievementCount(prevCount => Math.max(prevCount - 1, 0));

                // Stop idling and remove game from list if max achievement unlocks is reached
                if (achievementsRemaining === 0 || (maxAchievementUnlocks && achievementsRemaining <= achievements.length - maxAchievementUnlocks)) {
                    await stopIdle(game.appid, game.name);
                    removeGameFromUnlockerList(game.appid);
                    logEvent(`[Achievement Unlocker - maxAchievementUnlocks] Unlocked ${achievements.length - maxAchievementUnlocks}/${achievements.length} achievements for ${game.name} - removed`);
                    break;
                }

                // Stop idling and remove game from list if all achievements are unlocked
                if (achievementsRemaining === 0) {
                    await stopIdle(game.appid, game.name);
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
    try {
        const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        return gameSettings[appId]?.maxAchievementUnlocks || null;
    } catch (error) {
        handleError('getMaxAchievementUnlocks', error);
    }
};

// Remove a game from the unlocker list
const removeGameFromUnlockerList = (gameId) => {
    try {
        const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlockerListCache')) || [];
        const updatedAchievementUnlocker = achievementUnlocker.filter(arr => arr.appid !== gameId);
        localStorage.setItem('achievementUnlockerListCache', JSON.stringify(updatedAchievementUnlocker));
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

// Handle errors
const handleError = (functionName, error) => {
    if (!error) return;
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};