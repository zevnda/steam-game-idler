import React, { useContext } from 'react';
import { IoStop } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { handleStop } from '../hooks/useStopButton';
import { AppContext } from '../../layout/components/AppContext';

export default function StopButton({ activePage, gamesWithDrops, currentGame }) {
    const { setActivePage, isMountedRef, abortControllerRef } = useContext(AppContext);

    const borderWidths = [
        ...Array.from({ length: 500 }, (_, i) => 0.5 + i * 0.01),
        ...Array.from({ length: 500 }, (_, i) => 6 - i * 0.01),
    ];

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
                    <IoStop
                        className='text-red-400 hover:opacity-90 duration-200 cursor-pointer'
                        fontSize={50}
                        onClick={() => handleStop(isMountedRef, abortControllerRef, gamesWithDrops, activePage, setActivePage, currentGame)}
                    />
                </motion.div>
            </div>
        </React.Fragment>
    );
}