import React from 'react';
import { Modal, ModalContent, ModalBody, Button, ModalFooter } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { FaSignOutAlt } from 'react-icons/fa';
import { IoGameController, IoGift, IoSettings } from 'react-icons/io5';
import Sparkles from './Sparkles';
import useSideBar from '../hooks/useSideBar';

export default function SideBar({ setUserSummary, activePage, setActivePage, showFreeGamesTab }) {
    const {
        isOpen,
        onOpenChange,
        openConfirmation,
        handleLogout,
    } = useSideBar(setUserSummary, activePage, setActivePage);

    return (
        <React.Fragment>
            <div className='flex justify-between flex-col w-[62px] min-h-calc max-h-calc bg-sidebar dark:border-r border-border'>
                <div className='flex justify-center items-center flex-col'>
                    <div className='relative flex justify-center items-center w-full h-[62px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200' onClick={() => setActivePage('games')}>
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
                    {showFreeGamesTab && (
                        <div className='relative flex justify-center items-center w-full h-[62px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200' onClick={() => setActivePage('freeGames')}>
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

                <div className='flex flex-col justify-end items-center h-full'>
                    <div className='relative flex justify-center items-center w-full h-[62px] hover:bg-sgi dark:hover:bg-titlehover cursor-pointer duration-200' onClick={() => setActivePage('settings')}>
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
                    <div className='flex justify-center items-center w-full h-[62px] hover:bg-red-500 cursor-pointer duration-200' onClick={openConfirmation}>
                        <FaSignOutAlt className='text-offwhite rotate-180' fontSize={24} />
                    </div>
                </div>
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container border border-border rounded-md w-[350px]'>
                <ModalContent>
                    {(onClose) => (
                        <React.Fragment>
                            <ModalBody className='flex gap-5 p-4'>
                                <p className='text-sm font-semibold uppercase'>
                                    Confirm
                                </p>
                                <p className='text-xs mb-2'>
                                    Are you sure you want to log out?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='max-h-[25px] font-semibold rounded'
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='max-h-[25px] font-semibold rounded'
                                    onClick={() => handleLogout(onClose)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </React.Fragment>
                    )}
                </ModalContent>
            </Modal>
        </React.Fragment>
    );
}