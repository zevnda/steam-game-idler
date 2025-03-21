import { Modal, ModalContent, ModalBody, Button, ModalFooter, ModalHeader } from '@heroui/react';
import { useContext } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { TbAward, TbCards, TbDeviceGamepad2, TbGift, TbHeart, TbHourglassLow, TbPlayerPlay, TbSettings } from 'react-icons/tb';

import { IdleContext } from '@/components/contexts/IdleContext';
import { NavigationContext } from '@/components/contexts/NavigationContext';
import { StateContext } from '@/components/contexts/StateContext';
import useSideBar from '@/hooks/ui/useSideBar';

export default function SideBar() {
    const { idleGamesList } = useContext(IdleContext);
    const { isDarkMode, showFreeGamesTab, isCardFarming, isAchievementUnlocker } = useContext(StateContext);
    const { activePage, setActivePage } = useContext(NavigationContext);
    const { isOpen, onOpenChange, openConfirmation, handleLogout } = useSideBar(activePage, setActivePage);

    return (
        <>
            <div className='flex justify-between flex-col w-14 min-h-calc max-h-calc bg-titlebar'>
                <div className='flex justify-center items-center flex-col gap-2'>

                    <div className='flex justify-center items-center w-14'>
                        <div
                            className={`p-2 rounded-full duration-200 cursor-pointer active:scale-90 ${activePage === 'games' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}`}
                            onClick={() => setActivePage('games')}
                        >
                            <TbDeviceGamepad2 fontSize={22} />
                        </div>
                    </div>

                    <div className='flex justify-center items-center w-14'>
                        <div
                            className={`
                                p-2 rounded-full duration-200 cursor-pointer active:scale-90 
                                ${idleGamesList.length > 0 && 'text-dynamic animate-pulse'}
                                ${activePage === 'idling' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}
                                `}
                            onClick={() => setActivePage('idling')}
                        >
                            <TbPlayerPlay fontSize={22} />
                        </div>
                    </div>

                    <div className='flex justify-center items-center w-14'>
                        <div
                            className={`
                                p-2 rounded-full duration-200 cursor-pointer active:scale-90 
                                ${isCardFarming && 'text-dynamic animate-pulse'} 
                                ${activePage === 'customlists/card-farming' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}
                                `}
                            onClick={() => setActivePage('customlists/card-farming')}
                        >
                            <TbCards fontSize={22} />
                        </div>
                    </div>

                    <div className='flex justify-center items-center w-14'>
                        <div
                            className={`
                                p-2 rounded-full duration-200 cursor-pointer active:scale-90 
                                ${isAchievementUnlocker && 'text-dynamic animate-pulse'} 
                                ${activePage === 'customlists/achievement-unlocker' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}
                                `}
                            onClick={() => setActivePage('customlists/achievement-unlocker')}
                        >
                            <TbAward fontSize={22} />
                        </div>
                    </div>

                    <div className='flex justify-center items-center w-14'>
                        <div
                            className={`p-2 rounded-full duration-200 cursor-pointer active:scale-90 ${activePage === 'customlists/auto-idle' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}`}
                            onClick={() => setActivePage('customlists/auto-idle')}
                        >
                            <TbHourglassLow fontSize={22} />
                        </div>
                    </div>

                    <div className='flex justify-center items-center w-14'>
                        <div
                            className={`p-2 rounded-full duration-200 cursor-pointer active:scale-90 ${activePage === 'customlists/favorites' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}`}
                            onClick={() => setActivePage('customlists/favorites')}
                        >
                            <TbHeart fontSize={22} />
                        </div>
                    </div>

                    {showFreeGamesTab && (
                        <div className='flex justify-center items-center w-14'>
                            <div
                                className={`relative flex justify-center items-center p-2 rounded-full duration-200 cursor-pointer active:scale-90 ${activePage === 'freeGames' ? 'bg-yellow-400/20' : 'hover:bg-titlehover'}`}
                                onClick={() => setActivePage('freeGames')}
                            >
                                <TbGift className='text-[#ffc700]' fontSize={22} />
                            </div>
                        </div>
                    )}
                </div>

                {!isCardFarming && !isAchievementUnlocker && (
                    <div className='flex justify-center items-center flex-col gap-2 mb-3'>
                        <div className='flex justify-center items-center w-14'>
                            <div
                                className={`p-2 rounded-full duration-200 cursor-pointer active:scale-90 ${activePage === 'settings' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}`}
                                onClick={() => setActivePage('settings')}
                            >
                                <TbSettings fontSize={22} />
                            </div>
                        </div>

                        <div className='flex justify-center items-center w-14'>
                            <div className='hover:bg-danger p-2 rounded-full duration-200 cursor-pointer active:scale-90 group' onClick={openConfirmation}>
                                <FiLogOut className={`rotate-180 ${!isDarkMode && 'group-hover:text-button'} duration-200`} fontSize={20} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to log out?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='font-semibold rounded-lg'
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => handleLogout(onClose)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}