import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';

import ErrorToast from '@/components/ui/ErrorToast';
import { formatTime, getRandomDelay, isWithinSchedule, logEvent, startIdle, stopIdle, unlockAchievement } from '@/utils/utils';

export const useAchievementUnlocker = async (
    isInitialDelay,
    setIsInitialDelay,
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
            let currentGame = null;

            const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

            // Retrieve achievement unlocker games
            const achievementUnlockerList = await invoke('get_custom_lists', {
                steamId: userSummary.steamId,
                list: 'achievementUnlockerList'
            });

            // Delay for 10 seconds before starting
            if (isInitialDelay) {
                startCountdown(10000 / 60000, setCountdownTimer);
                await delay(10000, isMountedRef, abortControllerRef);
                setIsInitialDelay(false);
            }

            // Check if there are no games left to unlock achievements for
            if (achievementUnlockerList.list_data.length === 0) {
                logEvent('[Achievement Unlocker] No games left - stopping');
                if (currentGame) await stopIdle(currentGame.appId, currentGame.name);
                setIsComplete(true);
                return;
            }

            // Fetch achievements for the current game
            const achievementUnlockerGame = achievementUnlockerList.list_data[0];
            const { achievements, game, error } = await fetchAchievements(achievementUnlockerGame, setAchievementCount);

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
const fetchAchievements = async (game, setAchievementCount) => {
    const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
    const { hidden } = JSON.parse(localStorage.getItem('settings'))?.achievementUnlocker || {};
    const maxAchievementUnlocks = getMaxAchievementUnlocks(game.appid);

    try {
        const response = await invoke('get_achievement_data', { steamId: userSummary.steamId, appId: game.appid, refetch: true });

        const rawAchievements = response?.achievement_data?.achievements;

        if (!response?.achievement_data && response.includes('Failed to initialize Steam API')) {
            addToast({
                description: <ErrorToast
                    message='Account mismatch between Steam and SGI'
                    href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Account%20mismatch%20between%20Steam%20and%20SGI'
                />,
                color: 'danger'
            });
            handleError('fetchAchievements', 'Account mismatch between Steam and SGI');
            return { achievements: [], game };
        }

        if (!rawAchievements) {
            return { achievements: [], game };
        }

        // Handle games with protected achievements
        if (rawAchievements.some(achievement => achievement.protected_achievement === true)) {
            logEvent(`[Error] [Achievement Unlocker] ${game.name} (${game.appid}) contains protected achievements`);
            return { achievements: [], game };
        }

        // Filter out hidden achievements
        const achievements = rawAchievements
            .filter(achievement => {
                return !achievement.achieved && (!hidden || achievement.hidden === false);
            })
            .map(achievement => {
                return {
                    appId: game.appid,
                    id: achievement.id,
                    gameName: game.name,
                    percentage: achievement.percent || 0
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
        const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
        const settings = JSON.parse(localStorage.getItem('settings'))?.achievementUnlocker || {};
        const { hidden, interval, idle, schedule, scheduleFrom, scheduleTo } = settings;
        let isGameIdling = false;

        let achievementsRemaining = achievements.length;
        const maxAchievementUnlocks = getMaxAchievementUnlocks(game.appid);

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
                    await startIdle(game.appid, game.name, false, false);
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
                await unlockAchievement(userSummary.steamId, game.appid, achievement.id, game.name);
                achievementsRemaining--;
                logEvent(`[Achievement Unlocker] Unlocked ${achievement.name} for ${game.name}`);
                setAchievementCount(prevCount => Math.max(prevCount - 1, 0));

                // Stop idling and remove game from list if max achievement unlocks is reached
                if (achievementsRemaining === 0 || (maxAchievementUnlocks && achievementsRemaining <= achievements.length - maxAchievementUnlocks)) {
                    await stopIdle(game.appid, game.name);
                    removeGameFromUnlockerList(game.appid);
                    logEvent(`[Achievement Unlocker] Unlocked ${achievements.length - maxAchievementUnlocks}/${achievements.length} achievements for ${game.name} - removed`);
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
const removeGameFromUnlockerList = async (gameId) => {
    try {
        const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
        const achievementUnlockerList = await invoke('get_custom_lists', {
            steamId: userSummary.steamId,
            list: 'achievementUnlockerList'
        });
        const updatedAchievementUnlocker = achievementUnlockerList.list_data.filter(arr => arr.appid !== gameId);
        await invoke('update_custom_list', {
            steamId: userSummary.steamId,
            list: 'achievementUnlockerList',
            newList: updatedAchievementUnlocker
        });
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