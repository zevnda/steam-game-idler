import { Fragment, useContext } from 'react';

import { Divider } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import ThemeSwitch from '@/src/components/ui/theme/ThemeSwitch';
import useHeader from '@/src/hooks/ui/useHeader';
import UpdateButton from '@/src/components/updates/UpdateButton';
import Notifications from '@/src/components/notifications/Notifications';
import SearchBar from '@/src/components/ui/SearchBar';

import { HiMiniMinus } from 'react-icons/hi2';
import { BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { GoGrabber } from 'react-icons/go';

export default function Header() {
    const { setGameQueryValue, setAchievementQueryValue, canUpdate } = useContext(AppContext);
    const { windowMinimize, windowToggleMaximize, windowClose } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <Fragment>
            <div className='relative w-full h-14 bg-titlebar select-none'>
                <div className='flex justify-between items-center h-full text-titletext'>
                    <div
                        className='flex justify-center items-center gap-1 px-2 bg-sidebar h-full w-14 dark:border-r border-b border-border' data-tauri-drag-region
                    >
                        <GoGrabber className='text-offwhite' fontSize={28} data-tauri-drag-region />
                    </div>

                    <div className='flex justify-center items-center flex-grow h-full border-b border-border'>
                        <SearchBar />

                        {canUpdate && <UpdateButton />}

                        <Notifications />

                        <Divider className='w-[1px] h-full bg-titleborder' />

                        <ThemeSwitch />

                        <Divider className='w-[1px] h-full bg-titleborder' />

                        <div className='flex justify-center items-center h-full'>
                            <div className='flex justify-center items-center hover:bg-titlehover w-[55px] h-full cursor-pointer' onClick={windowMinimize}>
                                <HiMiniMinus fontSize={20} />
                            </div>
                            <div className='flex justify-center items-center hover:bg-titlehover w-[55px] h-full cursor-pointer' onClick={windowToggleMaximize}>
                                <BiWindows fontSize={16} />
                            </div>
                            <div className='flex justify-center items-center hover:bg-red-500 w-[55px] h-full cursor-pointer' onClick={windowClose}>
                                <IoClose fontSize={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}