import React, { useEffect, useState, useRef, useContext } from 'react';
import { checkDrops, formatTime, getAllGamesWithDrops, logEvent, startIdler, stopIdler } from '@/src/utils/utils';
import StopButton from './StopButton';
import { Button, Skeleton, Spinner } from '@nextui-org/react';
import { IoCheckmark } from 'react-icons/io5';
import { AppContext } from '../../layout/components/AppContext';

export default function CardFarming() {
    const { setActivePage } = useContext(AppContext);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());
    const [totalDropsRemaining, setTotalDropsRemaining] = useState(0);
    const [gamesWithDrops, setGamesWithDrops] = useState(new Set());
    const [isComplete, setIsComplete] = useState(false);
    const [countdownTimer, setCountdownTimer] = useState('');

    const farmingInterval = 60000 * 30;
    const shortDelay = 15000;
    const mediumDelay = 60000;
    const longDelay = 60000 * 5;

    useEffect(() => {
        const startCardFarming = async () => {
            try {
                const { totalDrops, gamesSet } = await checkGamesForDrops();
                setTotalDropsRemaining(totalDrops);
                setGamesWithDrops(gamesSet);

                if (isMountedRef.current && gamesSet.size > 0) {
                    await farmCards(gamesSet);
                    startCardFarming();
                } else {
                    logEvent('[Card Farming] No games left - stopping');
                    setIsComplete(true);
                }
            } catch (error) {
                console.error('Error in (startCardFarming) :', error);
            }
        };

        const abortController = abortControllerRef.current;

        startCardFarming();

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, []);

    const checkGamesForDrops = async () => {
        const cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
        const steamCookies = JSON.parse(localStorage.getItem('steamCookies')) || {};
        const userSummary = JSON.parse(localStorage.getItem('userSummary')) || {};
        const settings = JSON.parse(localStorage.getItem('settings')) || {};

        const gameDataArr = cardFarming.map(game => JSON.parse(game));
        const gamesSet = new Set();
        let totalDrops = 0;

        try {
            if (settings.cardFarming.allGames) {
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
                const dropCheckPromises = gameDataArr.map(async (gameData) => {
                    if (gamesSet.size >= 32) return Promise.resolve();
                    const dropsRemaining = await checkDrops(userSummary.steamId, gameData.appid, steamCookies.sid, steamCookies.sls);
                    if (dropsRemaining > 0) {
                        if (gamesSet.size < 32) {
                            gamesSet.add({ appId: gameData.appid, name: gameData.name });
                            totalDrops += dropsRemaining;
                            logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - starting`);
                        }
                    } else {
                        logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - removed from list`);
                        removeGameFromFarmingList(gameData.appid);
                    }
                });
                await Promise.all(dropCheckPromises);
            }
        } catch (error) {
            console.error('Error in (checkGamesForDrops) :', error);
        }

        return { totalDrops, gamesSet };
    };

    const farmCards = async (gamesSet) => {
        const farmingPromises = Array.from(gamesSet).map(game => farmGame(game));
        await Promise.all(farmingPromises);
    };

    const farmGame = async (game) => {
        try {
            await startAndStopIdler(game.appId, game.name, longDelay);
            startCountdown(mediumDelay / 60000);
            await delay(mediumDelay);
            await startAndStopIdler(game.appId, game.name, shortDelay);
            startCountdown(mediumDelay / 60000);
            await delay(mediumDelay);
            await startAndStopIdler(game.appId, game.name, farmingInterval);
            startCountdown(mediumDelay / 60000);
            await delay(mediumDelay);
            await startAndStopIdler(game.appId, game.name, shortDelay);
        } catch (error) {
            console.error('Error in (farmGame) :', error);
            logEvent(`[Error] in (farmGame) ${error}`);
        }
    };

    const startAndStopIdler = async (appId, name, duration) => {
        try {
            startCountdown(duration / 60000);
            startIdler(appId, name, true);
            await delay(duration);
            stopIdler(appId, name);
        } catch (error) {
            console.error('Error in (startAndStopIdler) :', error);
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
                        reject(new DOMException('Card farming stopped early', 'Stop'));
                    } else if (elapsedTime >= ms) {
                        clearInterval(intervalId);
                        resolve();
                    }
                    elapsedTime += checkInterval;
                }, checkInterval);

                abortControllerRef.current.signal.addEventListener('abort', () => {
                    clearInterval(intervalId);
                    reject(new DOMException('Card farming stopped early', 'Stop'));
                });
            });
        } catch (error) {
            console.error('Error in (delay) :', error);
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

    const removeGameFromFarmingList = (gameId) => {
        try {
            const cardFarming = JSON.parse(localStorage.getItem('cardFarming')) || [];
            const updatedCardFarming = cardFarming.filter(game => JSON.parse(game).id !== gameId);
            localStorage.setItem('cardFarming', JSON.stringify(updatedCardFarming));
        } catch (error) {
            console.error('Error in (removeGameFromFarmingList) :', error);
        }
    };

    const handleCancel = async () => {
        setActivePage('games');
        try {
            const stopPromises = Array.from(gamesWithDrops).map(game => stopIdler(game.appId, game.name));
            await Promise.all(stopPromises);
        } catch (error) {
            console.error('Error in (handleCancel) :', error);
        } finally {
            isMountedRef.current = false;
            abortControllerRef.current.abort();
        }
    };

    return (
        <React.Fragment>
            <div className='flex justify-evenly items-center flex-col p-4 w-full h-calc'>
                <div className='flex items-center flex-col'>
                    <p className='text-3xl font-semibold mb-2'>
                        Card Farming
                    </p>
                    {gamesWithDrops.size > 0 && totalDropsRemaining ? (
                        <React.Fragment>
                            <p className='text-sm'>
                                Idling <span className='font-bold text-sgi'>{gamesWithDrops.size}</span> game(s) with <span className='font-bold text-sgi '>{totalDropsRemaining}</span> total card drop(s) remaining
                            </p>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            {!isComplete ? (
                                <div className='flex py-1 h-[16px]'>
                                    <Skeleton className='w-[250px] h-[8px] rounded' />
                                </div>
                            ) : (
                                <p className='text-sm'>
                                    Finished
                                </p>
                            )}
                        </React.Fragment>
                    )}
                </div>

                {gamesWithDrops.size > 0 ? (
                    <React.Fragment>
                        <StopButton setActivePage={setActivePage} gamesWithDrops={gamesWithDrops} isMountedRef={isMountedRef} abortControllerRef={abortControllerRef} screen={'card-farming'} />

                        <p className='text-sm'>
                            Next action in <span className='font-bold text-sgi'>{countdownTimer}</span>
                        </p>
                    </React.Fragment>
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
                            <div className='flex justify-center flex-col items-center h-[100px] gap-4'>
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

                {gamesWithDrops.size > 0 ? (
                    <div className='grid grid-cols-3 gap-2 max-h-[170px] border border-border rounded p-2 overflow-y-auto'>
                        {[...Array.from(gamesWithDrops)].map((item) => (
                            <div key={item.appId} className='flex gap-1 border border-border rounded p-1'>
                                <div className='flex flex-col px-2'>
                                    <p className='text-sm font-semibold'>{item.name}</p>
                                    <p className='text-xs'>{item.appId}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <React.Fragment>
                        {!isComplete && (<Skeleton className='w-[250px] h-[38px] rounded' />)}
                    </React.Fragment>
                )}

                <p className='text-xs text-[#797979] dark:text-[#4f4f4f]'>
                    A max of 32 games can be idled at once
                </p>
            </div>
        </React.Fragment >
    );
}