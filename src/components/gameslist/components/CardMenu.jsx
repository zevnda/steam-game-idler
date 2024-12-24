import React from 'react';
import { TiMinus, TiPlus } from 'react-icons/ti';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { IoPlay, IoSettings } from 'react-icons/io5';
import { FaAward, FaSteam } from 'react-icons/fa';

export default function CardMenu({ item, favorites, cardFarming, achievementUnlocker, autoIdle, handleIdle, viewAchievments, viewStorePage, viewGameSettings, addToFavorites, removeFromFavorites, addToCardFarming, removeFromCardFarming, addToAchievementUnlocker, removeFromAchievementUnlocker, addToAutoIdle, removeFromAutoIdle }) {
    return (
        <React.Fragment>
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
                    {favorites.some(arr => arr.appid === item.appid) ? (
                        <DropdownItem
                            className='rounded'
                            key='fav-rem'
                            startContent={<TiMinus />}
                            onPress={() => removeFromFavorites(item)}
                            textValue='Remove from favorites'
                        >
                            <p className='text-sms'>Remove from favorites</p>
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            className='rounded'
                            key='fav-add'
                            startContent={<TiPlus />}
                            onPress={() => addToFavorites(item)}
                            textValue='Add to favorites'
                        >
                            <p className='text-sms'>Add to favorites</p>
                        </DropdownItem>
                    )}
                    {cardFarming.some(arr => arr.appid === item.appid) ? (
                        <DropdownItem
                            className='rounded'
                            key='cf-rem'
                            startContent={<TiMinus />}
                            onPress={() => removeFromCardFarming(item)}
                            textValue='Remove from card farming'
                        >
                            <p className='text-sms'>Remove from card farming</p>
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            className='rounded'
                            key='cf-add'
                            startContent={<TiPlus />}
                            onPress={() => addToCardFarming(item)}
                            textValue='Add to card farming'
                        >
                            <p className='text-sms'>Add to card farming</p>
                        </DropdownItem>
                    )}
                    {achievementUnlocker.some(arr => arr.appid === item.appid) ? (
                        <DropdownItem
                            className='rounded'
                            key='au-rem'
                            startContent={<TiMinus />}
                            onPress={() => removeFromAchievementUnlocker(item)}
                            textValue='Remove from achievement unlocker'
                        >
                            <p className='text-sms'>Remove from achievement unlocker</p>
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            className='rounded'
                            key='au-add'
                            startContent={<TiPlus />}
                            onPress={() => addToAchievementUnlocker(item)}
                            textValue='Add to achievement unlocker'
                        >
                            <p className='text-sms'>Add to achievement unlocker</p>
                        </DropdownItem>
                    )}
                    {autoIdle.some(arr => arr.appid === item.appid) ? (
                        <DropdownItem
                            className='rounded'
                            key='auto-rem'
                            startContent={<TiMinus />}
                            onPress={() => removeFromAutoIdle(item)}
                            textValue='Remove from auto idle'
                        >
                            <p className='text-sms'>Remove from auto idle</p>
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            className='rounded'
                            key='auto-add'
                            startContent={<TiPlus />}
                            onPress={() => addToAutoIdle(item)}
                            textValue='Add to auto idle'
                        >
                            <p className='text-sms'>Add to auto idle</p>
                        </DropdownItem>
                    )}
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
}