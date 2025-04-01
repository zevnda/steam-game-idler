import { Button } from '@heroui/react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TbCheck } from 'react-icons/tb';

import { useStateContext } from '@/components/contexts/StateContext';
import { useAchievementUnlocker } from '@/hooks/automation/useAchievementUnlocker';
import type { Game } from '@/types/game';
import type { ActivePageType } from '@/types/navigation';
import { stopIdle } from '@/utils/idle';

export default function AchievementUnlocker({ activePage }: { activePage: ActivePageType }): ReactElement {
    const { t } = useTranslation();
    const { isDarkMode, setIsAchievementUnlocker } = useStateContext();

    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController>(new AbortController());

    const [imageSrc, setImageSrc] = useState('');
    const [isInitialDelay, setIsInitialDelay] = useState(true);
    const [currentGame, setCurrentGame] = useState<Game | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [achievementCount, setAchievementCount] = useState(0);
    const [countdownTimer, setCountdownTimer] = useState('00:00:10');
    const [isWaitingForSchedule, setIsWaitingForSchedule] = useState(false);

    useEffect(() => {
        setImageSrc(isDarkMode ?
            'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/dbg.webp'
            : 'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/lbg.webp');
    }, [isDarkMode]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAchievementUnlocker(
            isInitialDelay,
            setIsInitialDelay,
            setCurrentGame,
            setIsComplete,
            setAchievementCount,
            setCountdownTimer,
            setIsWaitingForSchedule,
            isMountedRef,
            abortControllerRef
        );

        const abortController = abortControllerRef.current;

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`${activePage !== 'customlists/achievement-unlocker' && 'hidden'} absolute top-12 left-14 bg-base z-50 rounded-tl-xl border-t border-l border-border`}>
            <div className='relative flex justify-evenly items-center flex-col p-4 w-calc h-calc'>
                {imageSrc && (
                    <Image
                        src={imageSrc}
                        className='absolute top-0 left-0 w-full h-full object-cover rounded-tl-xl'
                        alt='background'
                        width={1920}
                        height={1080}
                        priority
                    />
                )}
                <div className='absolute bg-base/10 backdrop-blur-[10px] w-full h-full rounded-tl-xl' />

                <div className='flex items-center flex-col gap-6 z-10 backdrop-blur-md bg-base/20 p-8 border border-border/40 rounded-lg'>
                    <p className='text-3xl font-semibold'>
                        {t('common.achievementUnlocker')}
                    </p>

                    {isWaitingForSchedule && (
                        <p className='text-sm text-yellow-400'>
                            {t('automation.achievementUnlocker.scheduleWait')}
                        </p>
                    )}

                    {isComplete && (
                        <div className='border border-border rounded-full inline-block p-2 w-fit'>
                            <TbCheck className='text-green-400' fontSize={50} />
                        </div>
                    )}

                    {isInitialDelay && (
                        <p className='text-sm'>
                            <Trans
                                i18nKey='automation.achievementUnlocker.initialDelay'
                                values={{ timer: countdownTimer }}
                            >
                                Starting in <span className='font-bold text-sm text-dynamic'>{countdownTimer}</span>
                            </Trans>
                        </p>
                    )}

                    {!isInitialDelay && !isComplete && !isWaitingForSchedule && (
                        <>
                            <p>
                                <Trans
                                    i18nKey='automation.achievementUnlocker.progress'
                                    values={{
                                        count: achievementCount,
                                        appName: currentGame?.name,
                                    }}
                                    components={{
                                        1: <span className='font-bold text-dynamic' />,
                                        3: <span className='font-bold text-dynamic' />,
                                    }}
                                />
                            </p>

                            <p className='text-sm'>
                                <Trans
                                    i18nKey='automation.achievementUnlocker.delay'
                                    values={{ timer: countdownTimer }}
                                >
                                    Next unlock in <span className='font-bold text-sm text-dynamic'>{countdownTimer}</span>
                                </Trans>
                            </p>
                        </>
                    )}

                    <Button
                        size='sm'
                        color='danger'
                        className='min-h-[30px] font-semibold rounded-lg'
                        onPress={() => {
                            stopIdle(currentGame?.appid, currentGame?.name);
                            setIsAchievementUnlocker(false);
                        }}
                    >
                        {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
                    </Button>
                </div>
            </div>
        </div>
    );
}