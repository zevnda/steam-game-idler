import React from 'react';
import ThemeSwitch from './theme/ThemeSwitch';
import { Divider, Input } from '@nextui-org/react';
import { BiSolidLeaf } from 'react-icons/bi';
import { HiMiniMinus } from 'react-icons/hi2';
import { BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { RiSearchLine } from 'react-icons/ri';
import useHeader from '../hooks/useHeader';
import Notifications from '../../notifications/components/Notifications';

export default function Header({ inputValue, setInputValue, setIsQuery }) {
    const {
        windowMinimize,
        windowToggleMaximize,
        windowClose,
        handleChange,
        handleKeyDown
    } = useHeader(setInputValue, setIsQuery);

    return (
        <React.Fragment>
            <div className='relative w-full h-[62px] bg-titlebar select-none'>
                <div className='flex justify-between items-center h-full text-titletext'>
                    <div className='flex justify-center items-center gap-1 px-2 bg-sidebar h-full w-[62px] dark:border-r border-b border-border'>
                        <BiSolidLeaf className='text-offwhite' fontSize={40} />
                    </div>

                    <div className='flex justify-center items-center flex-grow h-full border-b border-border'>
                        <div className='flex flex-grow p-4' data-tauri-drag-region>
                            <Input
                                isClearable
                                placeholder='Search for a game'
                                startContent={<RiSearchLine />}
                                className='max-w-[400px]'
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded'] }}
                                value={inputValue}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onClear={() => { setInputValue(''); }}
                            />
                        </div>

                        <Notifications />

                        <Divider className='w-[1px] h-full bg-titleborder mx-2' />

                        <ThemeSwitch />

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