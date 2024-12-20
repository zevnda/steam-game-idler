import React from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { IoPlay, IoSettings } from 'react-icons/io5';
import { FaAward } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { useAutomate } from '@/src/components/gameslist/hooks/useAutomate';

export default function Automate({ setActivePage }) {
    const { startCardFarming, startAchievementUnlocker } = useAutomate(setActivePage);

    return (
        <React.Fragment>
            <Dropdown classNames={{ content: ['rounded p-0 bg-base border border-border'] }}>
                <DropdownTrigger>
                    <Button size='sm' color='primary' className='rounded-full'>
                        <div className='flex items-center gap-1'>
                            <p className='font-semibold text-white dark:text-black'>
                                Automate
                            </p>
                        </div>
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label='actions'>
                    <DropdownItem
                        className='rounded'
                        key='idle'
                        startContent={<IoPlay />}
                        onClick={startCardFarming}
                        textValue='Start achievement unlocker'
                    >
                        <p className='text-xs'>Start card farming</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='achiements'
                        startContent={<FaAward />}
                        onClick={startAchievementUnlocker}
                        textValue='Start achievement unlocker'
                    >
                        <p className='text-xs'>Start achievement unlocker</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='settings'
                        startContent={<IoSettings />}
                        onClick={() => setActivePage('settings')}
                        textValue='Change settings'
                    >
                        <p className='text-xs'>Change settings</p>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
}