import { Divider, Spinner, Tooltip } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useState } from 'react';
import { TbDownload } from 'react-icons/tb';

import { logEvent } from '@/utils/global/tasks';
import { showDangerToast } from '@/utils/global/toasts';

export default function UpdateButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        try {
            setIsLoading(true);
            const update = await check();
            if (update?.available) {
                localStorage.setItem('hasUpdated', 'true');
                await invoke('kill_all_steamutil_processes');
                await update.downloadAndInstall();
                await relaunch();
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            showDangerToast('Error checking for updates');
            console.error('Error in (handleUpdate):', error);
            logEvent(`Error in (handleUpdate): ${error}`);
        }
    };

    return (
        <>
            {isLoading ? (
                <div className='flex items-center p-2 rounded-full'>
                    <Spinner size='sm' variant='simple' />
                </div>
            ) : (
                <Tooltip content='Update Ready!' placement='left' closeDelay={0} size='sm' className='bg-titlehover text-content'>
                    <div className='flex justify-center items-center cursor-pointer' onClick={handleUpdate}>
                        <div className='flex items-center p-2 hover:bg-titlehover rounded-full'>
                            <TbDownload fontSize={18} className='text-success' />
                        </div>
                    </div>
                </Tooltip>
            )}
            <Divider className='w-[1px] h-6 bg-border' />
        </>
    );
}