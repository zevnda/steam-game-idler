import { Button, Spinner } from '@heroui/react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TbCheck } from 'react-icons/tb';

import { useStateContext } from '@/components/contexts/StateContext';
import { handleCancel, useCardFarming, type GameWithDrops } from '@/hooks/automation/useCardFarming';
import type { ActivePageType } from '@/types/navigation';

export default function CardFarming({ activePage }: { activePage: ActivePageType }): ReactElement {
    const { t } = useTranslation();
    const { isDarkMode, setIsCardFarming } = useStateContext();

    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());

    const [imageSrc, setImageSrc] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [totalDropsRemaining, setTotalDropsRemaining] = useState(0);
    const [gamesWithDrops, setGamesWithDrops] = useState<Set<GameWithDrops>>(new Set());
    const [disableStopButton, setDisableStopButton] = useState(true);

    useEffect(() => {
        setImageSrc(isDarkMode ?
            'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/dbg.webp'
            : 'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/lbg.webp');
    }, [isDarkMode]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useCardFarming(
            setIsComplete,
            setTotalDropsRemaining,
            setGamesWithDrops,
            isMountedRef,
            abortControllerRef
        );

        const abortController = abortControllerRef.current;

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setDisableStopButton(false);
        }, 5000);
    }, []);

    const renderGamesList = () => {
        if (!gamesWithDrops.size) {
            return <Spinner variant='simple' label={t('automation.cardFarming.initialDelay')} />;
        }

        return (
            <>
                {!isComplete && (
                    <p>
                        <Trans
                            i18nKey='automation.cardFarming.progress'
                            values={{
                                count: gamesWithDrops.size,
                                total: totalDropsRemaining
                            }}
                            components={{
                                1: <span className='font-bold text-dynamic' />,
                                3: <span className='font-bold text-dynamic' />,
                            }}
                        />
                    </p>
                )}

                <div className='p-2 border border-border rounded-lg'>
                    <div className='grid grid-cols-2 gap-2 max-h-[170px] p-2 overflow-y-auto'>
                        {[...Array.from(gamesWithDrops)].map((item) => (
                            <div key={item.appid} className='flex gap-1 border border-border rounded-lg p-1'>
                                <Image
                                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                                    className='aspect-[62/36] rounded'
                                    width={62}
                                    height={36}
                                    alt={`${item.name} image`}
                                    priority={true}
                                />
                                <div className='flex flex-col px-2 max-w-[80%]'>
                                    <p className='text-sm font-semibold truncate'>{item.name}</p>
                                    <p className='text-xs text-altwhite'>{item.appid}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    const renderContent = () => {
        if (isComplete) {
            return (
                <div className='border border-border rounded-full inline-block p-2 w-fit'>
                    <TbCheck className='text-green-400' fontSize={50} />
                </div>
            );
        }

        return renderGamesList();
    };

    return (
        <div className={`${activePage !== 'customlists/card-farming' && 'hidden'} absolute top-12 left-14 bg-base z-50 rounded-tl-xl border-t border-l border-border`}>
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
                        {t('common.cardFarming')}
                    </p>

                    {renderContent()}

                    <Button
                        size='sm'
                        isDisabled={!isComplete && disableStopButton}
                        color='danger'
                        className='min-h-[30px] font-semibold rounded-lg'
                        onPress={() => {
                            handleCancel(gamesWithDrops, isMountedRef, abortControllerRef);
                            setIsCardFarming(false);
                        }}
                    >
                        {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
                    </Button>
                </div>
            </div>
        </div>
    );
}