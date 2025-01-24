import React, { useState, useEffect, useRef, useContext } from 'react';
import StopButton from './StopButton';
import { Button, Spinner } from '@nextui-org/react';
import { IoCheckmark } from 'react-icons/io5';
import { startAchievementUnlocker, handleCancel } from '@/src/components/automation/utils/achievementUnlockerHandler';
import { AppContext } from '../../layout/components/AppContext';
import { useTheme } from 'next-themes';
import ExtLink from '../../ui/components/ExtLink';

export default function AchievementUnlocker() {
    const { theme } = useTheme();
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
    const [videoSrc, setVideoSrc] = useState('');
    const [isInitialDelay, setIsInitialDelay] = useState(true);

    useEffect(() => {
        setVideoSrc(
            theme === 'dark'
                ? 'https://cdn.pixabay.com/video/2017/12/20/13495-248644905_large.mp4'
                : 'https://cdn.pixabay.com/video/2020/07/30/45961-447087612_large.mp4'
        );
    }, [theme]);

    useEffect(() => {
        startAchievementUnlocker({
            isMountedRef,
            abortControllerRef,
            setHasPrivateGames,
            setAchievementCount,
            setCurrentGame,
            setGamesWithAchievements,
            setIsComplete,
            setCountdownTimer,
            setIsWaitingForSchedule,
        });

        setTimeout(() => {
            setIsInitialDelay(false);
        }, 15000);

        return () => {
            isMountedRef.current = false;
            abortControllerRef.current.abort();
        };
    }, []);

    return (
        <React.Fragment>
            <div className='relative flex justify-evenly items-center flex-col p-4 w-full h-calc'>
                <video
                    className='absolute top-0 left-0 w-full h-full object-cover'
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                />
                <div className='absolute bg-base/10 backdrop-blur-[3px] w-full h-full'></div>
                <div className='flex items-center flex-col z-10 backdrop-blur-md bg-base/20 p-8 border border-border rounded-md '>
                    <p className='text-3xl font-semibold mb-2'>
                        Achievement Unlocker
                    </p>
                    {hasPrivateGames ? (
                        <div className='flex flex-col items-center gap-2 text-sm'>
                            <div className='flex flex-col items-center gap-2 text-sm my-6'>
                                <p>Change your privacy settings for <strong>my profile</strong> and <strong>game details</strong> to <strong>public</strong></p>
                                <ExtLink href={'https://steamcommunity.com/id/undefined/edit/settings'} className='text-link hover:text-linkhover'>Change your privacy settings</ExtLink>
                            </div>

                            <Button
                                size='sm'
                                color='danger'
                                className='min-h-[30px] font-semibold rounded'
                                onPress={() => handleCancel({ isMountedRef, abortControllerRef, setActivePage, currentGame })}
                            >
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
                                <StopButton isMountedRef={isMountedRef} abortControllerRef={abortControllerRef} screen={'achievement-unlocker'} currentGame={currentGame} />
                            ) : (
                                <React.Fragment>
                                    {!isComplete ? (
                                        <div className='flex justify-center flex-col items-center h-[100px] gap-4'>
                                            <Spinner label={<p className='text-xs'>This may take a minute</p>} />
                                            <Button
                                                size='sm'
                                                color='danger'
                                                className='min-h-[30px] font-semibold rounded'
                                                onPress={() => handleCancel({ isMountedRef, abortControllerRef, setActivePage, currentGame })}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className='flex justify-center flex-col items-center h-[100px] gap-4 mt-4'>
                                            <div className='border border-border rounded-full inline-block p-2 w-fit'>
                                                <IoCheckmark className='text-green-400' fontSize={50} />
                                            </div>
                                            <Button
                                                size='sm'
                                                color='danger'
                                                className='min-h-[30px] font-semibold rounded'
                                                onPress={() => handleCancel({ isMountedRef, abortControllerRef, setActivePage, currentGame })}
                                            >
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
                                        <div className='flex items-center gap-1'>
                                            {isInitialDelay && (
                                                <p className='text-sm'>
                                                    Starting in
                                                </p>
                                            )}
                                            {!isInitialDelay && (
                                                <p className='text-sm'>
                                                    Next unlock in
                                                </p>
                                            )}
                                            <span className='font-bold text-sm text-sgi'>{countdownTimer}</span>
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};