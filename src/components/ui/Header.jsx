import { Fragment, useContext } from 'react';
import Image from 'next/image';

import { Divider, Input } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import ThemeSwitch from '@/src/components/ui/theme/ThemeSwitch';
import useHeader from '@/src/hooks/ui/useHeader';
import Notifications from '@/src/components/notifications/Notifications';

import { HiMiniMinus } from 'react-icons/hi2';
import { RiSearchLine } from 'react-icons/ri';
import { BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';

export default function Header() {
    const {
        activePage,
        showAchievements,
        gameQueryValue,
        setGameQueryValue,
        achievementQueryValue,
        setAchievementQueryValue,
        achievementsUnavailable,
        currentTab
    } = useContext(AppContext);

    const {
        windowMinimize,
        windowToggleMaximize,
        windowClose,
        handleGameQueryChange,
        handleAchievementQueryChange,
        handleKeyDown
    } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <Fragment>
            <div className='relative w-full h-14 bg-titlebar select-none'>
                <div className='flex justify-between items-center h-full text-titletext'>
                    <div className='flex justify-center items-center gap-1 px-2 bg-sidebar h-full w-14 dark:border-r border-b border-border'>
                        <Image
                            src={'/logo.png'}
                            width={32}
                            height={32}
                            alt='logo'
                        />
                    </div>

                    <div className='flex justify-center items-center flex-grow h-full border-b border-border'>
                        <div className='flex items-center flex-grow p-4 h-full' data-tauri-drag-region>
                            {activePage === 'games' && !showAchievements && (
                                <Input
                                    size='sm'
                                    isClearable
                                    isDisabled={activePage !== 'games' || showAchievements}
                                    placeholder='Search for a game'
                                    startContent={<RiSearchLine />}
                                    className='max-w-[400px]'
                                    classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar'] }}
                                    value={gameQueryValue}
                                    onChange={handleGameQueryChange}
                                    onKeyDown={handleKeyDown}
                                    onClear={() => { setGameQueryValue(''); }}
                                />
                            )}
                            {showAchievements && (
                                <Input
                                    size='sm'
                                    isClearable
                                    isDisabled={achievementsUnavailable || currentTab === 'statistics'}
                                    placeholder='Search for an achievement'
                                    startContent={<RiSearchLine />}
                                    className='max-w-[400px]'
                                    classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar'] }}
                                    value={achievementQueryValue}
                                    onChange={handleAchievementQueryChange}
                                    onClear={() => { setAchievementQueryValue(''); }}
                                />
                            )}
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
        </Fragment>
    );
}