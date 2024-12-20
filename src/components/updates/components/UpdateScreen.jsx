import React from 'react';
import { Progress, Spinner } from '@nextui-org/react';
import { HiMiniMinus } from 'react-icons/hi2';
import { BiSolidLeaf, BiWindows } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import useUpdateScreen from '../hooks/useUpdateScreen';
import { windowMinimize, windowToggleMaximize, windowClose } from '../utils/windowHandler';

export default function UpdateScreen({ updateManifest }) {
    const { appWindow, progress, checkForUpdate } = useUpdateScreen(updateManifest);

    return (
        <React.Fragment>
            <div className='flex justify-between items-center w-screen h-[62px] bg-titlebar' data-tauri-drag-region>
                <div className='flex items-center gap-1 px-2 bg-sgi dark:bg-[#181818] h-full w-[62px]'>
                    <BiSolidLeaf className='text-offwhite' fontSize={40} />
                </div>
                <div className='flex justify-center items-center h-full ml-2'>
                    <div className='flex justify-center items-center hover:bg-titlehover w-[32px] h-full cursor-pointer' onClick={() => windowMinimize(appWindow)}>
                        <HiMiniMinus fontSize={20} />
                    </div>
                    <div className='flex justify-center items-center hover:bg-titlehover w-[32px] h-full cursor-pointer' onClick={() => windowToggleMaximize(appWindow)}>
                        <BiWindows fontSize={16} />
                    </div>
                    <div className='flex justify-center items-center hover:bg-red-500 w-[32px] h-full cursor-pointer' onClick={() => windowClose(appWindow)}>
                        <IoClose fontSize={20} />
                    </div>
                </div>
            </div>
            <div className='flex justify-center items-center flex-col gap-2 w-screen h-[calc(100vh-62px)]'>
                {checkForUpdate ? (
                    <React.Fragment>
                        <p className='text-sm font-semibold'>
                            Checking for updates
                        </p>
                        <Spinner />
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <p className='text-sm font-semibold'>
                            Installing updates..
                        </p>
                        <Progress aria-label='progress-bar' color='secondary' size='sm' value={progress} className='w-1/2' />
                    </React.Fragment>
                )}
            </div>
        </React.Fragment>
    );
}