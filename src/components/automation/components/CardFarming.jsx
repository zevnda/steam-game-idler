import React, { useEffect, useState, useRef, useContext } from 'react';
import { logEvent } from '@/src/utils/utils';
import { checkGamesForDrops, farmCards, handleCancel } from '@/src/components/automation/utils/cardFarmingHandler';
import StopButton from './StopButton';
import { Button, Skeleton, Spinner } from '@nextui-org/react';
import { IoCheckmark } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { AppContext } from '../../layout/components/AppContext';

export default function CardFarming() {
    const { setActivePage } = useContext(AppContext);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(new AbortController());
    const [totalDropsRemaining, setTotalDropsRemaining] = useState(0);
    const [gamesWithDrops, setGamesWithDrops] = useState(new Set());
    const [isComplete, setIsComplete] = useState(false);
    const [countdownTimer, setCountdownTimer] = useState('');

    useEffect(() => {
        const startCardFarming = async () => {
            try {
                const { totalDrops, gamesSet } = await checkGamesForDrops();
                setTotalDropsRemaining(totalDrops);
                setGamesWithDrops(gamesSet);

                if (isMountedRef.current && gamesSet.size > 0) {
                    await farmCards(gamesSet, setCountdownTimer, isMountedRef, abortControllerRef);
                    startCardFarming();
                } else {
                    logEvent('[Card Farming] No games left - stopping');
                    setIsComplete(true);
                }
            } catch (error) {
                toast.error(`Error in (startCardFarming): ${error?.message || error}`);
                console.error('Error in (startCardFarming) :', error);
                logEvent(`[Error] in (startCardFarming) ${error}`);
            }
        };

        const abortController = abortControllerRef.current;

        startCardFarming();

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, []);

    return (
        <React.Fragment>
            <div className='flex justify-center items-center flex-col gap-10 p-4 w-full h-calc'>
                <div className='flex items-center flex-col'>
                    <p className='text-3xl font-semibold mb-0'>
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
                        <StopButton gamesWithDrops={gamesWithDrops} isMountedRef={isMountedRef} abortControllerRef={abortControllerRef} screen={'card-farming'} />

                        <p className='text-sm'>
                            Next action in <span className='font-bold text-sgi'>{countdownTimer}</span>
                        </p>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {!isComplete ? (
                            <div className='flex justify-center flex-col items-center h-[100px] gap-4'>
                                <Spinner label={<p className='text-xs'>This may take a minute</p>} />
                                <Button
                                    size='sm'
                                    color='danger'
                                    className='min-h-[30px] font-semibold rounded'
                                    onPress={() => handleCancel(setActivePage, gamesWithDrops, isMountedRef, abortControllerRef)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className='flex justify-center flex-col items-center h-[100px] gap-4'>
                                <div className='border border-border rounded-full inline-block p-2 w-fit'>
                                    <IoCheckmark className='text-green-400' fontSize={50} />
                                </div>
                                <Button
                                    size='sm'
                                    color='danger'
                                    className='min-h-[30px] font-semibold rounded'
                                    onPress={() => handleCancel(setActivePage, gamesWithDrops, isMountedRef, abortControllerRef)}
                                >
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
                    A max of 32 games can be idled simultaneously
                </p>
            </div>
        </React.Fragment >
    );
}