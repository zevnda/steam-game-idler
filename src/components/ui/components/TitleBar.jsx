import React from 'react';
import { IoClose } from 'react-icons/io5';
import useTitleBar from '../hooks/useTitleBar';
import ThemeSwitch from './theme/ThemeSwitch';
import Image from 'next/image';

export default function TitleBar() {
    const { windowClose } = useTitleBar();

    return (
        <React.Fragment>
            <div className='absolute top-0 h-[62px] select-none z-50 w-full backdrop-blur-md bg-base/20'>
                <div className='flex justify-between items-center h-full text-titletext' data-tauri-drag-region>
                    <div className='flex justify-center items-center gap-1 px-2 h-full w-[62px]'>
                        <Image
                            src={'/logo.png'}
                            width={40}
                            height={40}
                            alt='logo'
                        />
                    </div>

                    <ThemeSwitch />

                    <div className='flex justify-center items-center h-full'>
                        <div className='flex justify-center items-center h-full'>
                            <div className='flex justify-center items-center hover:bg-red-500 w-[62px] h-full cursor-pointer' onClick={windowClose}>
                                <IoClose fontSize={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}