import { Fragment, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

import { Button, Spinner } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import { handleCancel, useCardFarming } from '@/src/hooks/automation/useCardFarming';

import { TbCheck } from 'react-icons/tb';

export default function CardFarming({ activePage }) {
    const { theme } = useTheme();
    const { setIsCardFarming } = useContext(AppContext);

    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());

    const [imageSrc, setImageSrc] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [totalDropsRemaining, setTotalDropsRemaining] = useState(0);
    const [gamesWithDrops, setGamesWithDrops] = useState(0);
    const [disableStopButton, setDisableStopButton] = useState(true);

    useEffect(() => {
        const darkThemes = ['dark', 'midnight', 'amethyst', 'emerald', 'cherry', 'cosmic', 'mint', 'arctic', 'nightshade'];
        setImageSrc(darkThemes.includes(theme) ? `/dbg.webp` : `/lbg.webp`);
    }, [theme]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useCardFarming(
            setIsComplete,
            setTotalDropsRemaining,
            setGamesWithDrops,
            isMountedRef,
            abortControllerRef
        );

        return () => {
            isMountedRef.current = false;
            abortControllerRef.current.abort();
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setDisableStopButton(false);
        }, 5000);
    }, []);

    return (
        <Fragment>
            <div className={`${activePage !== 'customlists/card-farming' && 'hidden'} absolute top-12 left-14 bg-base z-50 rounded-tl-xl border-t border-l border-border`}>
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
                            Card Farming
                        </p>

                        {!isComplete ? (
                            <Fragment>
                                {gamesWithDrops.size > 0 ? (
                                    <Fragment>
                                        {!isComplete && (
                                            <Fragment>
                                                <p>
                                                    Idling <span className='font-bold text-dynamic'>{gamesWithDrops.size}</span> game(s) with <span className='font-bold text-dynamic'>{totalDropsRemaining}</span> total card drop(s) remaining
                                                </p>
                                            </Fragment>
                                        )}

                                        <div className='p-2 border border-border rounded-lg'>
                                            <div className='grid grid-cols-2 gap-2 max-h-[170px] p-2 overflow-y-auto'>
                                                {[...Array.from(gamesWithDrops)].map((item) => (
                                                    <div key={item.appId} className='flex gap-1 border border-border rounded-lg p-1'>
                                                        <Image
                                                            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appId}/header.jpg`}
                                                            className='aspect-[62/36] rounded'
                                                            width={62}
                                                            height={36}
                                                            alt={`${item.name} image`}
                                                            priority={true}
                                                        />
                                                        <div className='flex flex-col px-2 max-w-[80%]'>
                                                            <p className='text-sm font-semibold truncate'>{item.name}</p>
                                                            <p className='text-xs text-altwhite'>{item.appId}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Fragment>
                                ) : (
                                    <Spinner label={<p className='text-sm text-content'>This might take a second..</p>} />
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
                            isDisabled={!isComplete && disableStopButton}
                            color={isComplete ? 'primary' : 'danger'}
                            className={`min-h-[30px] font-semibold rounded-lg ${isComplete ? 'bg-dynamic text-content' : 'danger'}`}
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