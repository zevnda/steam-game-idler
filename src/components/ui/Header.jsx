import { Divider } from '@heroui/react';
import { useContext } from 'react';
import { GoGrabber } from 'react-icons/go';
import { TbMinus, TbSquare, TbX } from 'react-icons/tb';

import { SearchContext } from '@/components/contexts/SearchContext';
import { StateContext } from '@/components/contexts/StateContext';
import { UpdateContext } from '@/components/contexts/UpdateContext';
import Notifications from '@/components/notifications/Notifications';
import SearchBar from '@/components/ui/SearchBar';
import UpdateButton from '@/components/ui/UpdateButton';
import useHeader from '@/hooks/ui/useHeader';
import HeaderMenu from './HeaderMenu';

export default function Header() {
    const { isDarkMode } = useContext(StateContext);
    const { setGameQueryValue, setAchievementQueryValue } = useContext(SearchContext);
    const { updateAvailable } = useContext(UpdateContext);
    const { windowMinimize, windowToggleMaximize, windowClose } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <div className='relative w-full h-12 bg-titlebar select-none' data-tauri-drag-region>
            <div className='flex justify-between items-center h-full'>
                <div className='flex justify-center items-center gap-1 px-2 h-full w-14' data-tauri-drag-region>
                    <GoGrabber fontSize={28} data-tauri-drag-region />
                </div>

                <div className='flex justify-center items-center flex-grow gap-2 h-11' data-tauri-drag-region>
                    <SearchBar />

                    {updateAvailable && (<UpdateButton />)}

                    <Notifications />

                    <Divider className='w-[1px] h-6 bg-border' />

                    <HeaderMenu />

                    <Divider className='w-[1px] h-6 bg-border' />

                    <div className='flex justify-center items-center gap-2 h-full mr-3'>
                        <div className='flex justify-center items-center'>
                            <div className='hover:bg-titlehover p-2 rounded-full duration-200 cursor-pointer active:scale-90' onClick={windowMinimize}>
                                <TbMinus fontSize={20} />
                            </div>
                        </div>

                        <div className='flex justify-center items-center'>
                            <div className='hover:bg-titlehover p-2.5 rounded-full duration-200 cursor-pointer active:scale-90' onClick={windowToggleMaximize}>
                                <TbSquare fontSize={16} />
                            </div>
                        </div>

                        <div className='flex justify-center items-center'>
                            <div className={`hover:bg-danger p-2 rounded-full duration-200 cursor-pointer active:scale-90 ${!isDarkMode && 'hover:text-button'}`} onClick={windowClose}>
                                <TbX fontSize={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}