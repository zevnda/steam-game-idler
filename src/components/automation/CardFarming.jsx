import { Fragment, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

import { Button, Spinner } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import { handleCancel, useCardFarming } from '@/src/hooks/automation/useCardFarming';
import Image from 'next/image';

import { TbCheck } from 'react-icons/tb';

export default function CardFarming({ activePage }) {
    const { theme } = useTheme();
    const { setIsCardFarming } = useContext(AppContext);

    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());

    const [videoSrc, setVideoSrc] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [totalDropsRemaining, setTotalDropsRemaining] = useState(0);
    const [gamesWithDrops, setGamesWithDrops] = useState(0);
    const [countdownTimer, setCountdownTimer] = useState('');

    useEffect(() => {
        setVideoSrc(
            theme === 'dark'
                ? 'https://cdn.pixabay.com/video/2017/12/20/13495-248644905_large.mp4'
                : 'https://cdn.pixabay.com/video/2020/07/30/45961-447087612_large.mp4'
        );
    }, [theme]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useCardFarming(
            setIsComplete,
            setTotalDropsRemaining,
            setGamesWithDrops,
            setCountdownTimer,
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
            <div className={`${activePage !== 'customlists/card-farming' && 'hidden'} absolute top-12 left-14 bg-base z-50 rounded-tl-xl border-t border-l border-border`}>
                <div className='relative flex justify-evenly items-center flex-col p-4 w-calc h-calc'>
                    <video
                        className='absolute top-0 left-0 w-full h-full object-cover rounded-tl-xl'
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                    />
                    <div className='absolute bg-base/10 backdrop-blur-[3px] w-full h-full rounded-tl-xl'></div>

                    <div className='flex items-center flex-col gap-6 z-10 backdrop-blur-md bg-base/20 p-8 border border-border rounded-lg'>
                        <p className='text-3xl font-semibold'>
                            Card Farming
                        </p>

                        {!isComplete ? (
                            <Fragment>
                                {gamesWithDrops.size > 0 ? (
                                    <Fragment>
                                        {!isComplete && (
                                            <Fragment>
                                                <p>
                                                    Idling <span className='font-bold text-primary'>{gamesWithDrops.size}</span> game(s) with <span className='font-bold text-primary'>{totalDropsRemaining}</span> total card drop(s) remaining
                                                </p>

                                                <p className='text-sm'>
                                                    Next action in <span className='font-bold text-sm text-primary'>{countdownTimer}</span>
                                                </p>
                                            </Fragment>
                                        )}

                                        <div className='grid grid-cols-3 gap-2 max-h-[170px] border border-border rounded-lg p-2 overflow-y-auto'>
                                            {[...Array.from(gamesWithDrops)].map((item) => (
                                                <div key={item.appId} className='flex gap-1 border border-border rounded-lg p-1'>
                                                    <Image
                                                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appId}/header.jpg`}
                                                        className='aspect-[62/36]'
                                                        width={62}
                                                        height={36}
                                                        alt={`${item.name} image`}
                                                        priority={true}
                                                    />
                                                    <div className='flex flex-col px-2'>
                                                        <p className='text-sm font-semibold'>{item.name}</p>
                                                        <p className='text-xs'>{item.appId}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Fragment>
                                ) : (
                                    <Spinner label={<p className='text-sm'>This might take a second..</p>} />
                                )}
                            </Fragment>
                        ) : (
                            <Fragment>
                                <div className='border border-border rounded-full inline-block p-2 w-fit'>
                                    <TbCheck className='text-green-400' fontSize={50} />
                                </div>
                            </Fragment>
                        )}

                        <Button
                            size='sm'
                            color={isComplete ? 'primary' : 'danger'}
                            className='min-h-[30px] font-semibold rounded-lg'
                            onPress={() => {
                                handleCancel(gamesWithDrops, isMountedRef, abortControllerRef);
                                setIsCardFarming(false);
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