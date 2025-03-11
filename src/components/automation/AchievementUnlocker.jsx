import { Fragment, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

import { Button } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import { useAchievementUnlocker } from '@/src/hooks/automation/useAchievementUnlocker';
import { stopIdle } from '@/src/utils/utils';
import ExtLink from '@/src/components/ui/ExtLink';

import { TbCheck } from 'react-icons/tb';

export default function AchievementUnlocker({ activePage }) {
    const { theme } = useTheme();
    const { setIsAchievementUnlocker } = useContext(AppContext);

    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());

    const [imageSrc, setImageSrc] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [currentGame, setCurrentGame] = useState({});
    const [isComplete, setIsComplete] = useState(false);
    const [achievementCount, setAchievementCount] = useState(0);
    const [countdownTimer, setCountdownTimer] = useState('');
    const [isWaitingForSchedule, setIsWaitingForSchedule] = useState('');

    useEffect(() => {
        const darkThemes = ['dark', 'midnight', 'amethyst', 'emerald', 'cherry', 'cosmic', 'mint', 'arctic', 'nightshade'];
        setImageSrc(darkThemes.includes(theme) ?
            `https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/dbg.webp`
            : `https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/lbg.webp`);
    }, [theme]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAchievementUnlocker(
            setIsPrivate,
            setCurrentGame,
            setIsComplete,
            setAchievementCount,
            setCountdownTimer,
            setIsWaitingForSchedule,
            isMountedRef,
            abortControllerRef
        );

        return () => {
            isMountedRef.current = false;
            abortControllerRef.current.abort();
        };
    }, []);

    return (
        <Fragment>
            <div className={`${activePage !== 'customlists/achievement-unlocker' && 'hidden'} absolute top-12 left-14 bg-base z-50 rounded-tl-xl border-t border-l border-border`}>
                <div className='relative flex justify-evenly items-center flex-col p-4 w-calc h-calc'>
                    <Image
                        src={imageSrc}
                        className='absolute top-0 left-0 w-full h-full object-cover rounded-tl-xl'
                        alt='background'
                        width={1920}
                        height={1080}
                        priority
                    />
                    <div className='absolute bg-base/10 backdrop-blur-[10px] w-full h-full rounded-tl-xl'></div>

                    <div className='flex items-center flex-col gap-6 z-10 backdrop-blur-md bg-base/20 p-8 border border-border/40 rounded-lg'>
                        <p className='text-3xl font-semibold'>
                            Achievement Unlocker
                        </p>

                        {isPrivate && (
                            <div className='flex flex-col items-center gap-1 mb-2'>
                                <p className='text-lg font-semibold'>
                                    Uh-oh!
                                </p>
                                <p className='text-sm'>
                                    Your profile or game details are set to private
                                </p>
                                <p className='text-sm'>
                                    <ExtLink href={'https://steamcommunity.com/id/undefined/edit/settings'} className='text-link hover:text-linkhover'>
                                        Update privacy settings
                                    </ExtLink>
                                </p>
                            </div>
                        )}

                        {isWaitingForSchedule && (
                            <p className='text-sm text-yellow-400'>
                                Achievement unlocking paused due to being outside of the scheduled time and will resume again once inside the scheduled time
                            </p>
                        )}

                        {isComplete && (
                            <Fragment>
                                <div className='border border-border rounded-full inline-block p-2 w-fit'>
                                    <TbCheck className='text-green-400' fontSize={50} />
                                </div>
                            </Fragment>
                        )}

                        {!isComplete && !isPrivate && !isWaitingForSchedule && (
                            <Fragment>
                                <p>
                                    Unlocking <span className='font-bold text-dynamic'>{achievementCount}</span> achievement(s) for <span className='font-bold text-dynamic'>{currentGame.name}</span>
                                </p>

                                <p className='text-sm'>
                                    Next unlock in <span className='font-bold text-sm text-dynamic'>{countdownTimer}</span>
                                </p>
                            </Fragment>
                        )}

                        <Button
                            size='sm'
                            className={`min-h-[30px] font-semibold rounded-lg ${isComplete ? 'bg-dynamic text-content' : 'danger'}`}
                            onPress={() => {
                                setIsAchievementUnlocker(false);
                                stopIdle(currentGame.appid, currentGame.name);
                            }}
                        >
                            {isComplete ? <p>Close</p> : <p>Stop</p>}
                        </Button>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}