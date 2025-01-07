import React, { useState, useEffect, useRef, useContext } from 'react';
import StopButton from './StopButton';
import { Button, Spinner } from '@nextui-org/react';
import { formatTime, getRandomDelay, isWithinSchedule, logEvent, startIdler, stopIdler, unlockAchievement } from '@/src/utils/utils';
import { IoCheckmark } from 'react-icons/io5';
import { invoke } from '@tauri-apps/api/tauri';
import { AppContext } from '../../layout/components/AppContext';

export default function AchievementUnlocker() {
    const { setActivePage } = useContext(AppContext);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());
    const [hasPrivateGames, setHasPrivateGames] = useState(false);
    const [achievementCount, setAchievementCount] = useState(0);
    const [currentGame, setCurrentGame] = useState('');
    const [gamesWithAchievements, setGamesWithAchievements] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [countdownTimer, setCountdownTimer] = useState('');
    const [isWaitingForSchedule, setIsWaitingForSchedule] = useState(false);

    useEffect(() => {
        const startAchievementUnlocker = async () => {
            try {
                const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
                const settings = JSON.parse(localStorage.getItem('settings')) || {};

                if (achievementUnlocker.length < 1) {
                    logEvent('[Achievement Unlocker - Auto] No games left - stopping');
                    if (currentGame) {
                        await stopIdler(currentGame.appId, currentGame.name);
                    }
                    setGamesWithAchievements(0);
                    setIsComplete(true);
                    return;
                }

                const achievementData = await fetchAchievements(achievementUnlocker[0], settings);
                const achievements = achievementData?.achievements;
                const game = achievementData?.game;

                if (achievements?.length > 0) {
                    await unlockAchievements(achievements, settings, game);
                } else {
                    removeGameFromUnlockerList(game.appid);
                }

                if (isMountedRef.current) {
                    startAchievementUnlocker();
                }
            } catch (error) {
                console.error('Error in (startAchievementUnlocker):', error);
            }
        };

        const abortController = abortControllerRef.current;

        startAchievementUnlocker();

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, []);

    const fetchAchievements = async (gameData, settings) => {
        const game = JSON.parse(gameData);
        const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};

        try {
            setCurrentGame({ appId: game.appid, name: game.name });

            const apiKey = localStorage.getItem('apiKey');
            const res = await invoke('get_achievement_data', { steamId: userSummary.steamId, appId: game.appid.toString(), apiKey: apiKey });

            const userAchievements = res?.userAchievements?.playerstats;
            const gameAchievements = res?.percentages?.achievementpercentages?.achievements;
            const gameSchema = res?.schema?.game;

            if (!userAchievements) {
                setHasPrivateGames(true);
                return { achievements: [], game };
            }

            if (!gameAchievements || !gameSchema) {
                return { achievements: [], game };
            }

            const achievements = userAchievements.achievements
                .filter(achievement => {
                    const schemaAchievement = gameSchema.availableGameStats.achievements.find(
                        a => a.name === achievement.apiname
                    );
                    if (settings.achievementUnlocker.hidden) {
                        return !achievement.achieved && schemaAchievement.hidden === 0;
                    } else {
                        return !achievement.achieved;
                    }
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

            setAchievementCount(achievements.length);
            setGamesWithAchievements(achievements.length);

            return { achievements, game };
        } catch (error) {
            console.error('Error in (fetchAchievements):', error);
        }
    };

    const waitUntilInSchedule = async (scheduleFrom, scheduleTo) => {
        try {
            setIsWaitingForSchedule(true);
            while (!isWithinSchedule(scheduleFrom, scheduleTo)) {
                if (!isMountedRef.current) {
                    setIsWaitingForSchedule(false);
                    throw new DOMException('Achievement unlocking stopped due to being outside of the scheduled time', 'Stop');
                }
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
            setIsWaitingForSchedule(false);
        } catch (error) {
            console.error('Error in (waitUntilInSchedule):', error);
        }
    };

    const unlockAchievements = async (achievements, settings, game) => {
        try {
            const { interval, idle, schedule, scheduleFrom, scheduleTo } = settings.achievementUnlocker;

            let isGameIdling = false;

            if (idle && (schedule && isWithinSchedule(scheduleFrom, scheduleTo))) {
                await startIdler(achievements[0].appId, achievements[0].gameName, false);
                isGameIdling = true;
            }

            let achievementsRemaining = achievements?.length;

            for (const achievement of achievements) {
                if (isMountedRef.current) {
                    if (schedule && !isWithinSchedule(scheduleFrom, scheduleTo)) {
                        if (game) {
                            await stopIdler(game.appid, game.name);
                            isGameIdling = false;
                        }
                        await waitUntilInSchedule(scheduleFrom, scheduleTo);
                    } else {
                        if (!isGameIdling && idle) {
                            await startIdler(achievements[0].appId, achievements[0].gameName, false);
                            isGameIdling = true;
                        }
                    }
                    unlockAchievement(achievement.appId, achievement.name);
                    achievementsRemaining--;
                    logEvent(`[Achievement Unlocker - Auto] Unlocked ${achievement.name} for ${achievement.gameName}`);
                    setAchievementCount(prevCount => Math.max(prevCount - 1, 0));
                    if (achievementsRemaining === 0) {
                        await stopIdler(game.appid, game.name);
                        removeGameFromUnlockerList(game.appid);
                        break;
                    }
                    const randomDelay = getRandomDelay(interval[0], interval[1]);
                    startCountdown(randomDelay / 60000);
                    await delay(randomDelay);
                }
            }
        } catch (error) {
            console.error('Error in (unlockAchievements):', error);
            logEvent(`[Error] in (unlockAchievements) ${error}`);
        }
    };

    const removeGameFromUnlockerList = (gameId) => {
        try {
            const achievementUnlocker = JSON.parse(localStorage.getItem('achievementUnlocker')) || [];
            const updatedAchievementUnlocker = achievementUnlocker.filter(arr => JSON.parse(arr).appid !== gameId);
            localStorage.setItem('achievementUnlocker', JSON.stringify(updatedAchievementUnlocker));
        } catch (error) {
            console.error('Error in (unlockAchievements):', error);
            logEvent(`[Error] in (removeGameFromUnlockerList) ${error}`);
        }
    };

    const startCountdown = (durationInMinutes) => {
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
            console.error('Error in (startCountdown):', error);
        }
    };

    const delay = (ms) => {
        try {
            return new Promise((resolve, reject) => {
                const checkInterval = 1000;
                let elapsedTime = 0;

                const intervalId = setInterval(() => {
                    if (!isMountedRef.current) {
                        clearInterval(intervalId);
                        reject(new DOMException('Achievement unlocking stopped early', 'Stop'));
                    } else if (elapsedTime >= ms) {
                        clearInterval(intervalId);
                        resolve();
                    }
                    elapsedTime += checkInterval;
                }, checkInterval);

                abortControllerRef.current.signal.addEventListener('abort', () => {
                    clearInterval(intervalId);
                    reject(new DOMException('Achievement unlocking stopped early', 'Stop'));
                });
            });
        } catch (error) {
            console.error('Error in (delay):', error);
        }
    };

    const handleCancel = () => {
        isMountedRef.current = false;
        abortControllerRef.current.abort();
        setActivePage('games');
        stopIdler(currentGame.appId, currentGame.name);
    };

    return (
        <React.Fragment>
            <div className='flex justify-evenly items-center flex-col p-4 w-full h-calc'>
                <div className='flex items-center flex-col'>
                    <p className='text-3xl font-semibold mb-2'>
                        Achievement Unlocker
                    </p>
                    {hasPrivateGames ? (
                        <div className='flex flex-col items-center gap-2 text-xs'>
                            <p>Your games list must be set to <span className='font-bold'>public</span> in order for Achievement Unlocker to work</p>
                            <p>To change your privacy settings go to <span className='font-bold'>Steam &gt; Profile &gt; Edit Profile &gt; Privacy Settings &gt; Game Details &gt; Public</span></p>
                            <p>It may take up to 5 minutes for the changes to be applied</p>

                            <Button size='sm' className='bg-red-400 min-h-[30px] font-semibold text-offwhite rounded-sm' onClick={handleCancel}>
                                Back
                            </Button>
                        </div>
                    ) : (
                        <React.Fragment>
                            {!isComplete ? (
                                <React.Fragment>
                                    <p className='text-sm'>
                                        Unlocking <span className='font-bold text-sgi'>{achievementCount}</span> achievement(s) for <span className='font-bold text-sgi '>{currentGame.name}</span>
                                    </p>
                                </React.Fragment>
                            ) : (
                                <p className='text-sm'>
                                    Finished
                                </p>
                            )}

                            {gamesWithAchievements > 0 ? (
                                <StopButton setActivePage={setActivePage} isMountedRef={isMountedRef} abortControllerRef={abortControllerRef} screen={'achievement-unlocker'} currentGame={currentGame} />
                            ) : (
                                <React.Fragment>
                                    {!isComplete ? (
                                        <div className='flex justify-center flex-col items-center h-[100px] gap-4'>
                                            <Spinner label={<p className='text-xs'>This may take a minute</p>} />
                                            <Button size='sm' className='bg-red-400 min-h-[30px] font-semibold text-offwhite rounded-sm' onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className='flex justify-center flex-col items-center h-[100px] gap-4 mt-4'>
                                            <div className='border border-border rounded-full inline-block p-2 w-fit'>
                                                <IoCheckmark className='text-green-400' fontSize={50} />
                                            </div>
                                            <Button size='sm' className='bg-red-400 min-h-[30px] font-semibold text-offwhite rounded-sm' onClick={handleCancel}>
                                                Back
                                            </Button>
                                        </div>
                                    )}
                                </React.Fragment>
                            )}

                            {isWaitingForSchedule ? (
                                <p className='text-sm text-yellow-400'>
                                    Achievement unlocking paused due to being outside of the scheduled time and will resume again once inside of scheduled time
                                </p>
                            ) : (
                                <React.Fragment>
                                    {!isComplete && (
                                        <p className='text-sm'>
                                            Next unlock in <span className='font-bold text-sgi'>{countdownTimer}</span>
                                        </p>
                                    )}
                                </React.Fragment>
                            )}


                        </React.Fragment>
                    )}
                </div>
            </div>
        </React.Fragment >
    );
};