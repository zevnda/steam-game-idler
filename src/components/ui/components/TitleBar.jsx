import React from 'react';
import ThemeSwitch from './theme/ThemeSwitch';
import { BiSolidLeaf } from 'react-icons/bi';
import { HiMiniMinus } from 'react-icons/hi2';
import { BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import useTitleBar from '../hooks/useTitleBar';
import { Divider } from '@nextui-org/react';

export default function TitleBar() {
    const { windowMinimize, windowToggleMaximize, windowClose } = useTitleBar();

    return (
        <React.Fragment>
            <div className='h-[62px] bg-titlebar border-b border-titleborder select-none'>
                <div className='flex justify-between items-center h-full text-titletext' data-tauri-drag-region>
                    <div className='flex justify-center items-center gap-1 px-2 bg-sgi h-full w-[62px]'>
                        <BiSolidLeaf className='text-offwhite' fontSize={40} />
                    </div>

                    <div className='flex justify-center items-center h-full'>
                        <div className='flex items-center gap-2 h-full'>
                            <ThemeSwitch />
                        </div>

                        <Divider className='w-[1px] h-full bg-titleborder mx-2' />

                        <div className='flex justify-center items-center h-full'>
                            <div className='flex justify-center items-center hover:bg-titlehover w-[32px] h-full cursor-pointer' onClick={windowMinimize}>
                                <HiMiniMinus fontSize={20} />
                            </div>
                            <div className='flex justify-center items-center hover:bg-titlehover w-[32px] h-full cursor-pointer' onClick={windowToggleMaximize}>
                                <BiWindows fontSize={16} />
                            </div>
                            <div className='flex justify-center items-center hover:bg-red-500 w-[32px] h-full cursor-pointer' onClick={windowClose}>
                                <IoClose fontSize={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}