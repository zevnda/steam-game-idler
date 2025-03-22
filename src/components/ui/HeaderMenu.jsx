import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

import { TbLayoutNavbarExpand } from 'react-icons/tb';

import { invoke } from '@tauri-apps/api/core';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useContext, useState } from 'react';

import { UpdateContext } from '@/components/contexts/UpdateContext';
import ExtLink from '@/components/ui/ExtLink';
import { logEvent } from '@/utils/global/tasks';
import { fetchLatest, preserveKeysAndClearData } from '@/utils/global/tasks';
import { showDangerToast, showPrimaryToast } from '@/utils/global/toasts';

export default function HeaderMenu() {
    const { setShowChangelog } = useContext(UpdateContext);
    const [showMenu, setShowMenu] = useState(false);

    const handleUpdate = async () => {
        try {
            const update = await check();
            if (update?.available) {
                localStorage.setItem('hasUpdated', 'true');
                await invoke('kill_all_steamutil_processes');
                const latest = await fetchLatest();
                await update.downloadAndInstall();
                if (latest?.major) {
                    await preserveKeysAndClearData();
                }
                await relaunch();
            } else {
                showPrimaryToast('No updates available');
            }
        } catch (error) {
            showDangerToast('Error checking for updates');
            console.error('Error in (handleUpdate):', error);
            logEvent(`Error in (handleUpdate): ${error}`);
        }
    };

    return (
        <div className={`flex items-center p-2 hover:bg-titlehover rounded-full cursor-pointer active:scale-90 relative duration-200 ${showMenu && 'bg-titlehover'}`}>
            <Dropdown backdrop='opaque' onOpenChange={() => setShowMenu(!showMenu)} classNames={{ content: ['rounded-lg p-0 bg-titlebar border border-border'] }}>
                <DropdownTrigger>
                    <TbLayoutNavbarExpand fontSize={20} />
                </DropdownTrigger>
                <DropdownMenu aria-label='Settings actions' className='text-content'>
                    <DropdownItem key='help' className='rounded p-0 m-0' textValue='Help' classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                        <ExtLink href='https://steamgameidler.vercel.app/' className='flex text-sm w-full px-2 py-1'>
                            Help Getting Started
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='report' className='rounded p-0 m-0' textValue='Report an issue' classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                        <ExtLink href='https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels=bug%2Cinvestigating&projects=&template=issue_report.yml&title=Title' className='flex text-sm w-full px-2 py-1'>
                            Report an Issue
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='feature' className='rounded p-0 m-0' textValue='Feature request' classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                        <ExtLink href='https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels=feature+request&projects=&template=feature_request.yml&title=Title' className='flex text-sm w-full px-2 py-1'>
                            Feature Request
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='support-me' className='rounded p-0 m-0' textValue='Support me' classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                        <ExtLink href='https://github.com/sponsors/zevnda' className='flex text-sm w-full px-2 py-1'>
                            Support Me
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='changelog' className='rounded px-2 py-1' textValue='Changelog' onPress={() => setShowChangelog(true)} classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                        View Changelog
                    </DropdownItem>
                    <DropdownItem key='updates' className='rounded p-0 m-0' textValue='Check for updates' onPress={handleUpdate} classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                        <p className='flex  w-full px-2 py-1'>
                            Check for Updates..
                        </p>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
}