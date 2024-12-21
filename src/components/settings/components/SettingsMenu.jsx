import React from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import { useSettingsMenu } from '../hooks/useSettingsMenu';
import ExtLink from '@/src/components/ui/components/ExtLink';

export default function SettingsMenu({ setInitUpdate, setUpdateManifest }) {
    const { checkForUpdates } = useSettingsMenu(setInitUpdate, setUpdateManifest);

    return (
        <React.Fragment>
            <Dropdown classNames={{ content: ['rounded p-0 bg-base border border-border'] }}>
                <DropdownTrigger>
                    <Button
                        isIconOnly
                        size='sm'
                        className='bg-base hover:bg-titlebar border border-border rounded'
                    >
                        <BiDotsVerticalRounded size={24} />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label='Settings actions'>
                    <DropdownItem key='help' className='rounded p-0 m-0' textValue='Help'>
                        <ExtLink href={'https://github.com/zevnda/steam-game-idler/wiki'} className='flex text-sm w-full px-2 py-1'>
                            Help
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='changelog' className='rounded p-0 m-0' textValue='Changelog'>
                        <ExtLink href={'https://github.com/zevnda/steam-game-idler/releases'} className='flex text-sm w-full px-2 py-1'>
                            Changelog
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='report' className='rounded p-0 m-0' textValue='Report an issue'>
                        <ExtLink href={'https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels=bug%2Cinvestigating&projects=&template=issue_report.yml&title=Title'} className='flex text-sm w-full px-2 py-1'>
                            Report an Issue
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='feature' className='rounded p-0 m-0' textValue='Feature request'>
                        <ExtLink href={'https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels=feature+request&projects=&template=feature_request.yml&title=Title'} className='flex text-sm w-full px-2 py-1'>
                            Feature Request
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='support-me' className='rounded p-0 m-0' textValue='Support me'>
                        <ExtLink href={'https://github.com/sponsors/zevnda'} className='flex text-sm w-full px-2 py-1'>
                            Support Me
                        </ExtLink>
                    </DropdownItem>
                    <DropdownItem key='updates' className='rounded p-0 m-0' textValue='Check for updates' onPress={checkForUpdates}>
                        <p className='flex  w-full px-2 py-1'>
                            Check for Updates..
                        </p>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
}