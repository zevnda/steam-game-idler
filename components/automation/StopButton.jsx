import React from 'react';
import { IoStop } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { stopIdler } from '@/utils/utils';

export default function StopButton({ setActivePage, isMountedRef, abortControllerRef, gamesWithDrops, screen, currentGame }) {
    const borderWidths = [
        ...Array.from({ length: 500 }, (_, i) => 0.5 + i * 0.01),
        ...Array.from({ length: 500 }, (_, i) => 6 - i * 0.01),
    ];

    const handleStop = async () => {
        setActivePage('games');
        try {
            if (screen === 'card-farming') {
                const stopPromises = Array.from(gamesWithDrops).map(game => stopIdler(game.appId));
                await Promise.all(stopPromises);
            } else {
                await stopIdler(currentGame.appId);
            }
        } catch (error) {
            console.error('Error stopping games:', error);
        } finally {
            isMountedRef.current = false;
            abortControllerRef.current.abort();
        }
    };

    return (
        <React.Fragment>
            <div className='flex justify-center items-center w-[100px] h-[100px]'>
                <motion.div
                    animate={{
                        borderWidth: borderWidths,
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className='border border-border rounded-full inline-block p-2 w-fit'
                >
                    <IoStop className='text-red-400 hover:opacity-90 duration-200 cursor-pointer' fontSize={50} onClick={() => handleStop()} />
                </motion.div>
            </div>
        </React.Fragment>
    );
}