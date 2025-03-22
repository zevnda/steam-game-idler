import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useContext } from 'react';
import { TbDotsVertical } from 'react-icons/tb';

import { UpdateContext } from '@/components/contexts/UpdateContext';
import ExtLink from '@/components/ui/ExtLink';
import { logEvent } from '@/utils/global/tasks';
import { fetchLatest, preserveKeysAndClearData } from '@/utils/global/tasks';
import { showDangerToast, showPrimaryToast } from '@/utils/global/toasts';

export default function SettingsMenu() {
    const { setShowChangelog } = useContext(UpdateContext);

    const handleUpdate = async () => {
        try {
            const update = await check();
            if (update?.available) {
                localStorage.setItem('hasUpdated', 'true');
                const latest = await fetchLatest();
                await update.downloadAndInstall();
                if (latest?.major) {
                    await preserveKeysAndClearData();
                }
                await invoke('kill_all_steamutil_processes');
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
        <Dropdown classNames={{ content: ['rounded-lg p-0 bg-titlebar border border-border'] }}>
            <DropdownTrigger>
                <Button
                    isIconOnly
                    size='sm'
                    className='bg-base hover:bg-titlebar border border-border rounded-lg'
                    startContent={<TbDotsVertical fontSize={18} className='text-content' />}
                />
            </DropdownTrigger>
            <DropdownMenu aria-label='Settings actions' className='text-content'>
                <DropdownItem key='help' className='rounded p-0 m-0' textValue='Help' classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                    <ExtLink href='https://steamgameidler.vercel.app/' className='flex text-sm w-full px-2 py-1'>
                        Help
                    </ExtLink>
                </DropdownItem>
                <DropdownItem key='changelog' className='rounded px-2 py-1' textValue='Changelog' onPress={() => setShowChangelog(true)} classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                    Changelog
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
                <DropdownItem key='updates' className='rounded p-0 m-0' textValue='Check for updates' onPress={handleUpdate} classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>
                    <p className='flex  w-full px-2 py-1'>
                        Check for Updates..
                    </p>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}