import React, { useContext } from 'react';
import ThemeSwitch from './theme/ThemeSwitch';
import { Divider, Input } from '@nextui-org/react';
import { BiSolidLeaf } from 'react-icons/bi';
import { HiMiniMinus } from 'react-icons/hi2';
import { BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { RiSearchLine } from 'react-icons/ri';
import useHeader from '../hooks/useHeader';
import Notifications from '../../notifications/components/Notifications';
import { AppContext } from '../../layout/components/AppContext';

export default function Header() {
    const { activePage, showAchievements, gameQueryValue, setGameQueryValue, achievementQueryValue, setAchievementQueryValue, achievementsUnavailable, currentTab } = useContext(AppContext);

    const {
        windowMinimize,
        windowToggleMaximize,
        windowClose,
        handleGameQueryChange,
        handleAchievementQueryChange,
        handleKeyDown
    } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <React.Fragment>
            <div className='relative w-full h-[62px] bg-titlebar select-none'>
                <div className='flex justify-between items-center h-full text-titletext'>
                    <div className='flex justify-center items-center gap-1 px-2 bg-sidebar h-full w-[62px] dark:border-r border-b border-border'>
                        <BiSolidLeaf className='text-offwhite' fontSize={40} />
                    </div>

                    <div className='flex justify-center items-center flex-grow h-full border-b border-border'>
                        <div className='flex flex-grow p-4' data-tauri-drag-region>
                            {activePage === 'games' && !showAchievements && (
                                <Input
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
        </React.Fragment>
    );
}