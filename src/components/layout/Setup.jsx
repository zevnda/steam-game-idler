import { Fragment, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

import { Spinner } from '@heroui/react';
import { motion } from 'framer-motion';

import { AppContext } from '@/src/components/layout/AppContext';
import Header from '@/src/components/ui/Header';
import ExtLink from '@/src/components/ui/ExtLink';
import useSetup from '@/src/hooks/layout/useSetup';

import 'react-toastify/dist/ReactToastify.css';

export default function Setup() {
    const { theme } = useTheme();
    const { setActivePage } = useContext(AppContext);
    const { isLoading, handleLogin, steamUsers } = useSetup();
    const [videoSrc, setVideoSrc] = useState('');

    useEffect(() => {
        setActivePage('setup');
    }, []);

    useEffect(() => {
        setVideoSrc(
            theme === 'dark'
                ? 'https://cdn.pixabay.com/video/2017/12/20/13495-248644905_large.mp4'
                : 'https://cdn.pixabay.com/video/2020/07/30/45961-447087612_large.mp4'
        );
    }, [theme]);

    return (
        <Fragment>
            <Header />
            <div className='relative w-full bg-base border-t border-border'>
                <video
                    className='absolute top-0 left-0 w-full h-full object-cover'
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                />
                <div className='absolute bg-base/10 backdrop-blur-[3px] w-full h-full'></div>
                <div className='relative flex justify-center items-center flex-col gap-5 w-full h-svh'>
                    <motion.div
                        className='flex backdrop-blur-md bg-base/20 justify-center items-center flex-col border border-border min-w-[400px] max-w-[400px] rounded-lg shadow-lg dark:shadow-none'
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
                                <Spinner />
                            ) : steamUsers.length > 0 ? (
                                <Fragment>
                                    <p className='text-sm mb-2'>
                                        Choose an account
                                    </p>
                                    <div className='flex flex-col border border-border max-h-[200px] min-w-[300px] overflow-y-auto rounded-lg'>
                                        {steamUsers.map((item, index) => (
                                            <div
                                                key={index}
                                                className='last:border-none border-b border-border hover:bg-containerhover hover:bg-opacity-30'
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
                                                        <p className='text-xs text-altwhite truncate'>
                                                            {item.steamId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Fragment>
                            ) : (
                                <div className='flex flex-col items-center border border-border w-full rounded-lg p-4'>
                                    <p className='text-xs'>
                                        No Steam users found
                                    </p>
                                    <ExtLink href={'https://steamgameidler.vercel.app/faq#error-messages:~:text=No%20Steam%20users%20found'}>
                                        <p className='text-xs text-link hover:text-linkhover'>
                                            Learn why
                                        </p>
                                    </ExtLink>
                                </div>
                            )}
                        </div>

                        <div className='flex justify-center items-center p-6 w-full border-t border-border rounded-br-lg rounded-bl-lg mt-8'>
                            <ExtLink href={'https://steamgameidler.vercel.app/get-started/how-to-sign-in'}>
                                <p className='text-xs text-link hover:text-linkhover cursor-pointer'>
                                    Need help?
                                </p>
                            </ExtLink>
                        </div>
                    </motion.div>
                </div>
            </div>
        </Fragment>
    );
}