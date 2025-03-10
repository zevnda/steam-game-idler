import { Fragment } from 'react';

import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

import { FaSteam } from 'react-icons/fa';
import { TbAwardFilled, TbDotsVertical, TbPlayerPlayFilled, TbSettingsFilled } from 'react-icons/tb';

export default function CardMenu({ item, handleIdle, viewAchievments, viewStorePage, viewGameSettings }) {
    return (
        <Fragment>
            <Dropdown classNames={{ content: ['rounded-lg p-0 bg-base border border-border'] }}>
                <DropdownTrigger>
                    <div className='p-1 bg-black text-offwhite bg-opacity-50 hover:bg-black hover:bg-opacity-70 hover:scale-105 cursor-pointer rounded-lg duration-200'>
                        <TbDotsVertical />
                    </div>
                </DropdownTrigger>
                <DropdownMenu aria-label='actions'>
                    <DropdownItem
                        className='rounded'
                        key='idle'
                        startContent={<TbPlayerPlayFilled size={16} className='text-content' />}
                        onPress={() => handleIdle(item)}
                        textValue='Idle game'
                    >
                        <p className='text-sm text-content'>Idle game</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='achievements'
                        startContent={<TbAwardFilled size={16} className='text-content' />}
                        onPress={() => viewAchievments(item)}
                        textValue='View achievements'
                    >
                        <p className='text-sm text-content'>View achievements</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='store'
                        startContent={<FaSteam fontSize={16} className='text-content' />}
                        onPress={() => viewStorePage(item)}
                        textValue='View store page'
                    >
                        <p className='text-sm text-content'>View store page</p>
                    </DropdownItem>
                    <DropdownItem
                        className='rounded'
                        key='settings'
                        startContent={<TbSettingsFilled fontSize={16} className='text-content' />}
                        onPress={() => viewGameSettings(item)}
                        textValue='Game settings'
                    >
                        <p className='text-sm text-content'>Game settings</p>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </Fragment>
    );
}