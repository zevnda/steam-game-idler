import type { Time } from '@internationalized/date';
import { invoke } from '@tauri-apps/api/core';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import type {
    Game,
    InvokeAchievementData,
    InvokeSettings,
    InvokeCustomList,
    AchievementUnlockerSettings,
    UserSummary
} from '@/types';
import { unlockAchievement } from '@/utils/achievements';
import { isWithinSchedule } from '@/utils/automation';
import { startIdle, stopIdle } from '@/utils/idle';
import { logEvent } from '@/utils/tasks';
import { showAccountMismatchToast } from '@/utils/toasts';

interface GameWithAchievements {
    achievements: AchievementToUnlock[];
    game: Game;
}

interface AchievementToUnlock {
    appId: number;
    id: string;
    gameName: string;
    percentage: number;
    name?: string;
    hidden?: boolean;
}

export const useAchievementUnlocker = async (
    isInitialDelay: boolean,
    setIsInitialDelay: Dispatch<SetStateAction<boolean>>,
    setCurrentGame: Dispatch<SetStateAction<Game | null>>,
    setIsComplete: Dispatch<SetStateAction<boolean>>,
    setAchievementCount: Dispatch<SetStateAction<number>>,
    setCountdownTimer: Dispatch<SetStateAction<string>>,
    setIsWaitingForSchedule: Dispatch<SetStateAction<boolean>>,
    isMountedRef: RefObject<boolean>,
    abortControllerRef: RefObject<AbortController>
): Promise<void> => {
    let hasInitialDelayOccurred = !isInitialDelay;

    const startAchievementUnlocker = async (): Promise<void> => {
        try {
            let currentGame: Game | null = null as Game | null;

            const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary;

            // Retrieve achievement unlocker games
            const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
                steamId: userSummary?.steamId,
                list: 'achievementUnlockerList'
            });

            // Delay for 10 seconds before starting
            if (!hasInitialDelayOccurred) {
                startCountdown(10000 / 60000, setCountdownTimer);
                await delay(10000, isMountedRef, abortControllerRef);
                setIsInitialDelay(false);
                hasInitialDelayOccurred = true;
            }

            // Check if there are no games left to unlock achievements for
            if (achievementUnlockerList.list_data.length === 0) {
                logEvent('[Achievement Unlocker] No games left - stopping');

                if (currentGame !== null) {
                    await stopIdle(currentGame?.appid, currentGame.name);
                }

                setIsComplete(true);
                return;
            }

            // Fetch achievements for the current game
            const achievementUnlockerGame = achievementUnlockerList.list_data[0];
            const { achievements, game } = await fetchAchievements(achievementUnlockerGame, setAchievementCount);

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
                await removeGameFromUnlockerList(game.appid);
                logEvent(`[Achievement Unlocker] ${game.name} (${game.appid}) has no achievements remaining - removed`);
            }

            // Rerun if component is still mounted - needed check if user stops feature during loop
            if (isMountedRef.current) startAchievementUnlocker();
        } catch (error) {
            handleError('startAchievementUnlocker', error);
        }
    };

    startAchievementUnlocker();
};

// Fetch achievements for the current game
const fetchAchievements = async (
    game: Game,
    setAchievementCount: Dispatch<SetStateAction<number>>
): Promise<GameWithAchievements> => {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary;
    const maxAchievementUnlocks = await getMaxAchievementUnlocks(userSummary?.steamId, game.appid);

    const response = await invoke<InvokeSettings>('get_user_settings', {
        steamId: userSummary?.steamId
    });
    const hidden = response.settings.achievementUnlocker.hidden;

    try {
        const achievementResponse = await invoke<InvokeAchievementData | string>('get_achievement_data', {
            steamId: userSummary?.steamId,
            appId: game.appid,
            refetch: true
        });

        if (typeof achievementResponse === 'string' && achievementResponse.includes('Failed to initialize Steam API')) {
            showAccountMismatchToast('danger');
            handleError('fetchAchievements', 'Account mismatch between Steam and SGI');
            return { achievements: [], game };
        }

        const achievementData = achievementResponse as InvokeAchievementData;
        const rawAchievements = achievementData?.achievement_data?.achievements;

        if (!rawAchievements) {
            return { achievements: [], game };
        }

        // Handle games with protected achievements
        if (rawAchievements.some(achievement => achievement.protected_achievement === true)) {
            logEvent(`[Error] [Achievement Unlocker] ${game.name} (${game.appid}) contains protected achievements`);
            return { achievements: [], game };
        }

        // Filter out hidden achievements
        const achievements: AchievementToUnlock[] = rawAchievements
            .filter(achievement => {
                return !achievement.achieved && (!hidden || achievement.hidden === false);
            })
            .map(achievement => {
                return {
                    appId: game.appid,
                    id: achievement.id,
                    gameName: game.name,
                    percentage: achievement.percent || 0,
                    name: achievement.name,
                    hidden: achievement.hidden
                };
            })
            .sort((a, b) => b.percentage - a.percentage);

        setAchievementCount(maxAchievementUnlocks || achievements.length);

        return { achievements, game };
    } catch (error) {
        handleError('fetchAchievements', error);
        return { achievements: [], game };
    }
};

const unlockAchievements = async (
    achievements: AchievementToUnlock[],
    game: Game,
    setAchievementCount: Dispatch<SetStateAction<number>>,
    setCountdownTimer: Dispatch<SetStateAction<string>>,
    setIsWaitingForSchedule: Dispatch<SetStateAction<boolean>>,
    isMountedRef: RefObject<boolean>,
    abortControllerRef: RefObject<AbortController>
): Promise<void> => {
    try {
        const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary;

        const response = await invoke<InvokeSettings>('get_user_settings', {
            steamId: userSummary?.steamId
        });

        const settings: AchievementUnlockerSettings = response.settings.achievementUnlocker;
        const { hidden, interval, idle, schedule, scheduleFrom, scheduleTo } = settings;
        let isGameIdling = false;

        let achievementsRemaining = achievements.length;
        const maxAchievementUnlocks = await getMaxAchievementUnlocks(userSummary?.steamId, game.appid);

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
                    await startIdle(game.appid, game.name, false);
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
                await unlockAchievement(userSummary?.steamId, game.appid, achievement.id, game.name);
                achievementsRemaining--;
                logEvent(`[Achievement Unlocker] Unlocked ${achievement.name} for ${game.name}`);
                setAchievementCount(prevCount => Math.max(prevCount - 1, 0));

                // Stop idling and remove game from list if max achievement unlocks is reached
                if (achievementsRemaining === 0 || (maxAchievementUnlocks && achievementsRemaining <= achievements.length - maxAchievementUnlocks)) {
                    await stopIdle(game.appid, game.name);
                    await removeGameFromUnlockerList(game.appid);
                    logEvent(`[Achievement Unlocker] Unlocked ${maxAchievementUnlocks !== null ? achievements.length - maxAchievementUnlocks : achievements.length}/${achievements.length} achievements for ${game.name} - removed`);
                    break;
                }

                // Stop idling and remove game from list if all achievements are unlocked
                if (achievementsRemaining === 0) {
                    await stopIdle(game.appid, game.name);
                    await removeGameFromUnlockerList(game.appid);
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

const getMaxAchievementUnlocks = async (steamId: string | undefined, appId: number): Promise<number | null> => {
    try {
        const response = await invoke<InvokeSettings>('get_user_settings', { steamId });
        const gameSettings = response.settings.gameSettings || {};
        return gameSettings[appId]?.maxAchievementUnlocks || null;
    } catch (error) {
        handleError('getMaxAchievementUnlocks', error);
        return null;
    }
};

// Remove a game from the unlocker list
const removeGameFromUnlockerList = async (gameId: number): Promise<void> => {
    try {
        const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary;

        const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
            steamId: userSummary?.steamId,
            list: 'achievementUnlockerList'
        });

        const updatedAchievementUnlocker = achievementUnlockerList.list_data.filter(arr => arr.appid !== gameId);

        await invoke<InvokeCustomList>('update_custom_list', {
            steamId: userSummary?.steamId,
            list: 'achievementUnlockerList',
            newList: updatedAchievementUnlocker
        });
    } catch (error) {
        handleError('removeGameFromUnlockerList', error);
    }
};

// Start the countdown timer
const startCountdown = (
    durationInMinutes: number,
    setCountdownTimer: Dispatch<SetStateAction<string>>
): void => {
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
const waitUntilInSchedule = async (
    scheduleFrom: Time,
    scheduleTo: Time,
    isMountedRef: RefObject<boolean>,
    setIsWaitingForSchedule: Dispatch<SetStateAction<boolean>>,
    abortControllerRef: RefObject<AbortController>
): Promise<void> => {
    try {
        setIsWaitingForSchedule(true);
        while (!isWithinSchedule(scheduleFrom, scheduleTo)) {
            if (!isMountedRef.current) {
                setIsWaitingForSchedule(false);
                return;
            }
            await new Promise<void>((resolve, reject) => {
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
const delay = (
    ms: number,
    isMountedRef: RefObject<boolean>,
    abortControllerRef: RefObject<AbortController>
) => {
    try {
        return new Promise<void>((resolve, reject) => {
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
        return Promise.reject(error);
    }
};

// Get a random delay between a minimum and maximum value
export function getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * ((max - min) * 60 * 1000 + 1)) + min * 60 * 1000;
};

// Format time in HH:MM:SS format
export function formatTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Handle errors
const handleError = (functionName: string, error: unknown): void => {
    if (!error) return;
    console.error(`Error in (${functionName}):`, error);
    logEvent(`[Error] in (${functionName}) ${error}`);
};