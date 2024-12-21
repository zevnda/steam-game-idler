import React, { useContext } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { IoPlay, IoSettings } from 'react-icons/io5';
import { FaAward } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { useAutomate } from '@/src/components/gameslist/hooks/useAutomate';
import { AppContext } from '../../layouts/components/AppContext';

export default function Automate() {
    const { setActivePage } = useContext(AppContext);
    const { startCardFarming, startAchievementUnlocker } = useAutomate();

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
                        onPress={startCardFarming}
                        textValue='Start achievement unlocker'
                    >
                        <p className='text-sm'>Start card farming</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='achiements'
                        startContent={<FaAward />}
                        onPress={startAchievementUnlocker}
                        textValue='Start achievement unlocker'
                    >
                        <p className='text-sm'>Start achievement unlocker</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='settings'
                        startContent={<IoSettings />}
                        onPress={() => setActivePage('settings')}
                        textValue='Change settings'
                    >
                        <p className='text-sm'>Change settings</p>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
}