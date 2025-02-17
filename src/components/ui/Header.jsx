import { Fragment, useContext } from 'react';

import { Divider } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import useHeader from '@/src/hooks/ui/useHeader';
import UpdateButton from '@/src/components/updates/UpdateButton';
import Notifications from '@/src/components/notifications/Notifications';
import SearchBar from '@/src/components/ui/SearchBar';

import { GoGrabber } from 'react-icons/go';
import { TbMinus, TbSquare, TbX } from 'react-icons/tb';

export default function Header() {
    const { setGameQueryValue, setAchievementQueryValue, canUpdate } = useContext(AppContext);
    const { windowMinimize, windowToggleMaximize, windowClose } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <Fragment>
            <div className='relative w-full h-12 bg-titlebar select-none' data-tauri-drag-region>
                <div className='flex justify-between items-center h-full'>
                    <div className='flex justify-center items-center gap-1 px-2 h-full w-14' data-tauri-drag-region>
                        <GoGrabber fontSize={28} data-tauri-drag-region />
                    </div>

                    <div className='flex justify-center items-center flex-grow gap-2 h-11' data-tauri-drag-region>
                        <SearchBar />

                        {canUpdate && <UpdateButton />}

                        <Notifications />

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
                                <div className='hover:bg-danger p-2 rounded-full duration-200 cursor-pointer active:scale-90' onClick={windowClose}>
                                    <TbX fontSize={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}