import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ThemeSwitch from './theme/ThemeSwitch';
import { Divider, Input } from '@nextui-org/react';
import { BiSolidLeaf } from 'react-icons/bi';
import { HiMiniMinus } from 'react-icons/hi2';
import { BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { RiSearchLine } from 'react-icons/ri';
import ExtLink from './ExtLink';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
import Notifications from './notifications/components/Notifications';

export default function Header({ userSummary, inputValue, setInputValue, setIsQuery }) {
    const [appWindow, setAppWindow] = useState();

    async function setupAppWindow() {
        const appWindow = (await import('@tauri-apps/api/window')).appWindow;
        setAppWindow(appWindow);
    };

    useEffect(() => {
        setupAppWindow();
    }, []);

    const windowMinimize = () => {
        appWindow?.minimize();
    };

    const windowToggleMaximize = () => {
        appWindow?.toggleMaximize();
    };

    const windowClose = async () => {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const minToTrayNotified = localStorage.getItem('minToTrayNotified') || 'false';
        const { minimizeToTray } = settings?.general || {};
        if (minimizeToTray) {
            appWindow?.hide();
            let permissionGranted = await isPermissionGranted();
            if (minToTrayNotified !== 'true') {
                if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                }
                if (permissionGranted) {
                    sendNotification({
                        title: 'Steam Game Idler will continue to run in the background',
                        icon: 'icons/32x32.png'
                    });
                }
            }
            localStorage.setItem('minToTrayNotified', 'true');
        } else {
            appWindow?.close();
        }
    };

    const handleQuery = () => {
        setIsQuery(true);
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = () => {
        handleQuery('query');
    };

    return (
        <React.Fragment>
            <div className='relative w-full h-[62px] bg-titlebar select-none'>
                <div className='flex justify-between items-center h-full text-titletext'>
                    <div className='flex justify-center items-center gap-1 px-2 bg-sgi dark:bg-[#181818] h-full w-[62px]'>
                        <BiSolidLeaf className='text-offwhite' fontSize={40} />
                    </div>

                    <div className='flex justify-center items-center flex-grow h-full'>
                        <div className='flex flex-grow p-4' data-tauri-drag-region>
                            <Input
                                isClearable
                                placeholder='Search for a game'
                                startContent={<RiSearchLine />}
                                className='max-w-[400px]'
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-sm'] }}
                                value={inputValue}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onClear={() => { setInputValue(''); }}
                            />
                        </div>

                        <Notifications />

                        <Divider className='w-[1px] h-full bg-titleborder mx-2' />

                        <div className='flex items-center gap-2 h-full'>
                            <ThemeSwitch />
                            <ExtLink href={`https://steamcommunity.com/profiles/${userSummary.steamId}`}>
                                <div className='flex items-center gap-2 h-full p-2'>
                                    <div className='text-end max-w-[180px]'>
                                        <p className='font-medium truncate'>
                                            {userSummary.personaName}
                                        </p>
                                        <p className='text-xs text-neutral-400 truncate'>
                                            {userSummary.steamId}
                                        </p>
                                    </div>
                                    <Image src={userSummary.avatar} height={40} width={40} alt='user avatar' className='w-[40px] h-[40px] rounded-full' />
                                </div>
                            </ExtLink>
                        </div>

                        <Divider className='w-[1px] h-full bg-titleborder mx-2' />

                        <div className='flex justify-center items-center h-full'>
                            <div className='flex justify-center items-center hover:bg-titlehover w-[28px] h-full cursor-pointer' onClick={windowMinimize}>
                                <HiMiniMinus />
                            </div>
                            <div className='flex justify-center items-center hover:bg-titlehover w-[28px] h-full cursor-pointer' onClick={windowToggleMaximize}>
                                <BiWindows fontSize={12} />
                            </div>
                            <div className='flex justify-center items-center hover:bg-red-500 w-[28px] h-full cursor-pointer' onClick={windowClose}>
                                <IoClose />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}