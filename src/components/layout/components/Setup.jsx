import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Spinner } from '@nextui-org/react';
import ExtLink from '../../ui/components/ExtLink';
import TitleBar from '../../ui/components/TitleBar';
import useSetup from '../hooks/useSetup';
import 'react-toastify/dist/ReactToastify.css';

export default function Setup() {
    const { isLoading, handleLogin, steamUsers } = useSetup();
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.5;
        }
    }, []);

    return (
        <React.Fragment>
            <TitleBar />
            <div className='relative w-full bg-[#101010] text-white'>
                <video
                    ref={videoRef}
                    className='absolute top-0 left-0 w-full h-full object-cover blur-lg brightness-[.4]'
                    src='/setup_bg.mp4'
                    autoPlay
                    loop
                    muted
                />
                <div className='relative flex justify-center items-center flex-col gap-5 w-full h-svh'>
                    <motion.div
                        className='flex bg-[#101010] bg-opacity-70 justify-center items-center flex-col border border-border min-w-[400px] max-w-[400px] rounded-lg shadow-soft-lg dark:shadow-none'
                        initial={{ y: 500 }}
                        animate={{ y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 23,
                        }}
                    >
                        <div className='p-6'>
                            <p className='text-2xl '>
                                Welcome
                            </p>
                        </div>
                        <div className='flex justify-center items-center flex-col'>
                            {isLoading ? (
                                <Spinner />
                            ) : steamUsers.length > 0 ? (
                                <React.Fragment>
                                    <p className='text-sm mb-2'>
                                        Choose an account
                                    </p>
                                    <div className='flex flex-col border border-[#ffffff15] max-h-[200px] min-w-[300px] overflow-y-auto rounded '>
                                        {steamUsers.map((item, index) => (
                                            <div
                                                key={index}
                                                className='last:border-none border-b border-[#ffffff15] hover:bg-[#101010] hover:bg-opacity-30'
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
                                                        <p className='text-xs text-neutral-400 truncate'>
                                                            {item.steamId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </React.Fragment>
                            ) : (
                                <div className='flex flex-col items-center border border-border w-full rounded p-4'>
                                    <p className='text-xs'>
                                        No Steam users found
                                    </p>
                                    <ExtLink href={'https://github.com/zevnda/steam-game-idler/wiki/FAQ#:~:text=Why am I seeing "No Steam users found" on the login screen?'}>
                                        <p className='text-xs text-link hover:text-linkhover'>
                                            Learn why
                                        </p>
                                    </ExtLink>
                                </div>
                            )}
                        </div>

                        <div className='flex justify-center items-center p-6 w-full border-t border-border rounded-br-lg rounded-bl-lg mt-8'>
                            <ExtLink href={'https://github.com/zevnda/steam-game-idler/wiki/User-interface#welcome-screen'}>
                                <p className='text-xs text-link hover:text-linkhover cursor-pointer'>
                                    Need help?
                                </p>
                            </ExtLink>
                        </div>
                    </motion.div>
                </div>
            </div>
        </React.Fragment>
    );
}