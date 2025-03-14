import { Spinner } from '@heroui/react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';

import { NavigationContext } from '@/components/contexts/NavigationContext';
import { StateContext } from '@/components/contexts/StateContext';
import ExtLink from '@/components/ui/ExtLink';
import Header from '@/components/ui/Header';
import useSetup from '@/hooks/layout/useSetup';

export default function Setup() {
    const { isDarkMode } = useContext(StateContext);
    const { setActivePage } = useContext(NavigationContext);
    const { isLoading, handleLogin, steamUsers } = useSetup();
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        setActivePage('setup');
    }, [setActivePage]);

    useEffect(() => {
        setImageSrc(isDarkMode ?
            'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/dbg.webp'
            : 'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/lbg.webp');
    }, [isDarkMode]);

    return (
        <>
            <Header />
            <div className='relative w-full bg-base border-t border-border/40'>
                {imageSrc && (
                    <Image
                        src={imageSrc}
                        className='absolute top-0 left-0 w-full h-full object-cover'
                        alt='background'
                        width={1920}
                        height={1080}
                        priority
                    />
                )}
                <div className='absolute bg-base/10 backdrop-blur-[10px] w-full h-full' />
                <div className='relative flex justify-center items-center flex-col gap-5 w-full h-svh'>
                    <motion.div
                        className='flex backdrop-blur-md bg-base/20 justify-center items-center flex-col border border-border/40 min-w-[400px] max-w-[400px] rounded-lg shadow-lg dark:shadow-none'
                        initial={{ y: 500 }}
                        animate={{ y: -30 }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 23,
                        }}
                    >
                        <div className='p-6'>
                            <p className='text-2xl'>
                                Welcome
                            </p>
                        </div>
                        <div className='flex justify-center items-center flex-col'>
                            {isLoading ? (
                                <Spinner variant='simple' />
                            ) : steamUsers.length > 0 ? (
                                <>
                                    <p className='text-sm mb-2'>
                                        Choose an account
                                    </p>
                                    <div className='flex flex-col border border-border/40 max-h-[200px] min-w-[300px] overflow-y-auto rounded-lg'>
                                        {steamUsers.map((item, index) => (
                                            <div
                                                key={item.steamId}
                                                className='last:border-none border-b border-border/40 hover:bg-containerhover hover:bg-opacity-30'
                                                onClick={() => handleLogin(index)}
                                            >
                                                <div className='flex gap-2 h-full p-2 w-full cursor-pointer group'>
                                                    <Image
                                                        src={item.avatar}
                                                        height={40}
                                                        width={40}
                                                        alt='user avatar'
                                                        priority
                                                        className='w-[40px] h-[40px] rounded-full group-hover:scale-110 duration-200'
                                                    />
                                                    <div className='w-[140px]'>
                                                        <p className='font-medium truncate'>
                                                            {item.personaName}
                                                        </p>
                                                        <p className='text-xs truncate'>
                                                            {item.steamId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className='flex flex-col items-center border border-border/40 w-full rounded-lg p-4'>
                                    <p className='text-xs'>
                                        No Steam users found
                                    </p>
                                    <ExtLink href='https://steamgameidler.vercel.app/faq#error-messages:~:text=No%20Steam%20users%20found'>
                                        <p className='text-xs text-link hover:text-linkhover'>
                                            Learn why
                                        </p>
                                    </ExtLink>
                                </div>
                            )}
                        </div>

                        <div className='flex justify-center items-center p-6 w-full border-t border-border/40 rounded-br-lg rounded-bl-lg mt-8'>
                            <ExtLink href='https://steamgameidler.vercel.app/get-started/how-to-sign-in'>
                                <p className='text-xs text-content font-semibold cursor-pointer'>
                                    Need help?
                                </p>
                            </ExtLink>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}