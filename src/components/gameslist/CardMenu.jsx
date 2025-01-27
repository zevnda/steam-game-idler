import { Fragment } from 'react';

import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

import { BsThreeDotsVertical } from 'react-icons/bs';
import { IoPlay, IoSettings } from 'react-icons/io5';
import { FaAward, FaSteam } from 'react-icons/fa';

export default function CardMenu({ item, handleIdle, viewAchievments, viewStorePage, viewGameSettings }) {
    return (
        <Fragment>
            <Dropdown classNames={{ content: ['rounded p-0 bg-base border border-border'] }}>
                <DropdownTrigger>
                    <div className='p-1 bg-black text-offwhite bg-opacity-50 hover:bg-black hover:bg-opacity-70 hover:scale-105 cursor-pointer rounded duration-200'>
                        <BsThreeDotsVertical />
                    </div>
                </DropdownTrigger>
                <DropdownMenu aria-label='actions'>
                    <DropdownItem
                        className='rounded'
                        key='idle'
                        startContent={<IoPlay />}
                        onPress={() => handleIdle(item)}
                        textValue='Idle game'
                    >
                        <p className='text-sms'>Idle game</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='achievements'
                        startContent={<FaAward />}
                        onPress={() => viewAchievments(item)}
                        textValue='View achievements'
                    >
                        <p className='text-sms'>View achievements</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='store'
                        startContent={<FaSteam fontSize={13} />}
                        onPress={() => viewStorePage(item)}
                        textValue='View store page'
                    >
                        <p className='text-sms'>View store page</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='settings'
                        startContent={<IoSettings fontSize={13} />}
                        onPress={() => viewGameSettings(item)}
                        textValue='Game settings'
                    >
                        <p className='text-sms'>Game settings</p>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </Fragment>
    );
}