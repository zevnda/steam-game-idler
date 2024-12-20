import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@nextui-org/react';
import ExtLink from '../../ui/components/ExtLink';
import TitleBar from '../../ui/components/TitleBar';
import useSetup from '../hooks/useSetup';
import 'react-toastify/dist/ReactToastify.css';

export default function Setup({ setUserSummary }) {
    const { isLoading, handleClick } = useSetup(setUserSummary);

    return (
        <React.Fragment>
            <TitleBar />
            <div className='flex justify-center items-center flex-col gap-5 w-full min-h-calc'>
                <motion.div
                    className='flex justify-center items-center flex-col border border-border min-w-[400px] max-w-[400px] rounded-lg shadow-soft-lg dark:shadow-none'
                    initial={{ y: 500 }}
                    animate={{ y: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 23,
                    }}
                >
                    <div className='flex items-center flex-col gap-2 p-6'>
                        <Image src={'/logo.webp'} width={32} height={32} alt='logo' priority={true} />
                        <p className='text-4xl'>
                            Welcome
                        </p>
                    </div>
                    <div className='flex justify-center items-center flex-col gap-5 pb-6'>
                        <Button
                            size='sm'
                            color='primary'
                            isLoading={isLoading}
                            className='font-semibold rounded'
                            onClick={handleClick}
                        >
                            Continue
                        </Button>
                    </div>
                    <div className='flex justify-center items-center p-6 w-full bg-[#f6f6f6] dark:bg-[#181818] border-t border-border rounded-br-lg rounded-bl-lg'>
                        <ExtLink href={'https://github.com/probablyraging/steam-game-idler/wiki/User-interface#welcome-screen'}>
                            <p className='text-xs text-link hover:text-linkhover cursor-pointer'>
                                Need help?
                            </p>
                        </ExtLink>
                    </div>
                </motion.div>
            </div>
        </React.Fragment>
    );
}