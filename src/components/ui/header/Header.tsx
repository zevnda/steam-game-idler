import { cn, Divider } from '@heroui/react';
import type { ReactElement } from 'react';
import { TbMinus, TbSquare, TbX } from 'react-icons/tb';

import { useStateContext } from '@/components/contexts/StateContext';
import { useUpdateContext } from '@/components/contexts/UpdateContext';
import Notifications from '@/components/notifications/Notifications';
import HeaderMenu from '@/components/ui/header/HeaderMenu';
import HeaderTitle from '@/components/ui/header/HeaderTitle';
import SearchBar from '@/components/ui/header/SearchBar';
import UpdateButton from '@/components/ui/UpdateButton';
import useHeader from '@/hooks/ui/useHeader';

export default function Header(): ReactElement {
    const { isDarkMode } = useStateContext();
    const { updateAvailable } = useUpdateContext();
    const { windowMinimize, windowToggleMaximize, windowClose } = useHeader();

    return (
        <div className='relative w-full h-12 bg-titlebar select-none' data-tauri-drag-region>
            <div className='flex justify-between items-center h-full'>
                <div className='flex justify-center items-center flex-grow gap-2 h-11' data-tauri-drag-region>
                    <HeaderTitle />

                    <SearchBar />

                    {updateAvailable && (<UpdateButton />)}

                    <Notifications />

                    <Divider className='w-[1px] h-6 bg-header-border' />

                    <HeaderMenu />

                    <Divider className='w-[1px] h-6 bg-header-border' />

                    <div className='flex justify-center items-center gap-2 h-full mr-3'>
                        <div className='flex justify-center items-center'>
                            <div
                                className='hover:bg-titlehover p-2 rounded-full duration-200 cursor-pointer active:scale-90'
                                onClick={windowMinimize}
                            >
                                <TbMinus fontSize={20} />
                            </div>
                        </div>

                        <div className='flex justify-center items-center'>
                            <div
                                className='hover:bg-titlehover p-2.5 rounded-full duration-200 cursor-pointer active:scale-90'
                                onClick={windowToggleMaximize}
                            >
                                <TbSquare fontSize={16} />
                            </div>
                        </div>

                        <div className='flex justify-center items-center'>
                            <div
                                className={cn(
                                    'hover:bg-danger p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                                    !isDarkMode && 'hover:text-button-text'
                                )}
                                onClick={windowClose}
                            >
                                <TbX fontSize={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}