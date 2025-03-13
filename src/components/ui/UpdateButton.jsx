import { Fragment } from 'react';

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import { Divider, Tooltip } from '@heroui/react';

import { TbDownload } from 'react-icons/tb';

export default function UpdateButton() {

    const handleUpdate = async () => {
        try {
            const update = await check();
            if (update?.available) {
                await update.downloadAndInstall();
                localStorage.setItem('hasUpdated', 'true');
                await relaunch();
            }
        } catch (error) {
            console.error('Error in (handleUpdate):', error);
        }
    };

    return (
        <Fragment>
            <Tooltip content='Update Ready!' placement='left' closeDelay={0} size='sm' className='bg-titlehover text-content'>
                <div className='flex justify-center items-center cursor-pointer' onClick={handleUpdate}>
                    <div className='flex items-center p-2 hover:bg-titlehover rounded-full'>
                        <TbDownload fontSize={18} className='text-success' />
                    </div>
                </div>
            </Tooltip>
            <Divider className='w-[1px] h-6 bg-border' />
        </Fragment>
    );
}