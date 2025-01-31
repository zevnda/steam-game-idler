import { Fragment, useContext } from 'react';

import { Modal, ModalContent, ModalBody, Button, ModalFooter, ModalHeader } from '@heroui/react';
import { motion } from 'framer-motion';

import { AppContext } from '@/src/components/layout/AppContext';
import useSideBar from '@/src/hooks/ui/useSideBar';
import Sparkles from '@/src/components/ui/Sparkles';

import { FaAward, FaHourglassEnd, FaSignOutAlt } from 'react-icons/fa';
import { IoGameController, IoGift, IoSettings } from 'react-icons/io5';
import { TbCardsFilled } from 'react-icons/tb';
import { MdFavorite } from 'react-icons/md';

export default function SideBar() {
    const { showFreeGamesTab, activePage, setActivePage, isCardFarming, isAchievementUnlocker } = useContext(AppContext);
    const { isOpen, onOpenChange, openConfirmation, handleLogout } = useSideBar(activePage, setActivePage);

    return (
        <Fragment>
            <div className='flex justify-between flex-col w-14 min-h-calc max-h-calc bg-sidebar dark:border-r border-border'>
                <div className='flex justify-center items-center flex-col'>
                    <div className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200' onClick={() => setActivePage('games')}>
                        {activePage === 'games' && (
                            <motion.div
                                className='absolute w-full border-r-4 border-white'
                                initial={{ height: 0 }}
                                whileInView={{ height: 30 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 18,
                                }}
                            />
                        )}
                        <IoGameController className='text-offwhite' fontSize={24} />
                    </div>

                    <div
                        className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200'
                        onClick={() => setActivePage('customlists/card-farming')}
                    >
                        {activePage === 'customlists/card-farming' && (
                            <motion.div
                                className='absolute w-full border-r-4 border-white'
                                initial={{ height: 0 }}
                                whileInView={{ height: 30 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 18,
                                }}
                            />
                        )}
                        <TbCardsFilled className={`text-offwhite ${isCardFarming && 'animate-pulse'}`} fontSize={24} />
                    </div>

                    <div
                        className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200'
                        onClick={() => setActivePage('customlists/achievement-unlocker')}
                    >
                        {activePage === 'customlists/achievement-unlocker' && (
                            <motion.div
                                className='absolute w-full border-r-4 border-white'
                                initial={{ height: 0 }}
                                whileInView={{ height: 30 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 18,
                                }}
                            />
                        )}
                        <FaAward className={`text-offwhite ${isAchievementUnlocker && 'animate-pulse'}`} fontSize={22} />
                    </div>

                    <div
                        className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200'
                        onClick={() => setActivePage('customlists/auto-idle')}
                    >
                        {activePage === 'customlists/auto-idle' && (
                            <motion.div
                                className='absolute w-full border-r-4 border-white'
                                initial={{ height: 0 }}
                                whileInView={{ height: 30 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 18,
                                }}
                            />
                        )}
                        <FaHourglassEnd className='text-offwhite' fontSize={20} />
                    </div>

                    <div
                        className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200'
                        onClick={() => setActivePage('customlists/favorites')}
                    >
                        {activePage === 'customlists/favorites' && (
                            <motion.div
                                className='absolute w-full border-r-4 border-white'
                                initial={{ height: 0 }}
                                whileInView={{ height: 30 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 18,
                                }}
                            />
                        )}
                        <MdFavorite className='text-offwhite' fontSize={20} />
                    </div>

                    {showFreeGamesTab && (
                        <div className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200' onClick={() => setActivePage('freeGames')}>
                            {activePage === 'freeGames' && (
                                <motion.div
                                    className='absolute w-full border-r-4 border-white'
                                    initial={{ height: 0 }}
                                    whileInView={{ height: 30 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 18,
                                    }}
                                />
                            )}
                            <Sparkles />
                            <IoGift className='text-[#ffc700]' fontSize={24} />
                        </div>
                    )}
                </div>

                {!isCardFarming && !isAchievementUnlocker && (
                    <div className='flex flex-col justify-end items-center h-full'>
                        <div className='relative flex justify-center items-center w-full h-[55px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200' onClick={() => setActivePage('settings')}>
                            {activePage === 'settings' && (
                                <motion.div
                                    className='absolute w-full border-r-4 border-white'
                                    initial={{ height: 0 }}
                                    whileInView={{ height: 30 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 18,
                                    }}
                                />
                            )}
                            <IoSettings className='text-offwhite' fontSize={24} />
                        </div>
                        <div className='flex justify-center items-center w-full h-[55px] hover:bg-red-500 cursor-pointer duration-200' onClick={openConfirmation}>
                            <FaSignOutAlt className='text-offwhite rotate-180' fontSize={24} />
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container'>
                <ModalContent>
                    {(onClose) => (
                        <Fragment>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to log out?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='font-semibold rounded'
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='font-semibold rounded'
                                    onPress={() => handleLogout(onClose)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </Fragment>
                    )}
                </ModalContent>
            </Modal>
        </Fragment>
    );
}