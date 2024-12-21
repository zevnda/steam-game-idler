import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { useNotifications } from '../hooks/useNotifications';
import { IoCheckmark } from 'react-icons/io5';
import { GoDotFill } from 'react-icons/go';

export default function Notifications() {
    const {
        notifications,
        showNotifications,
        setShowNotifications,
        unseenNotifications,
        setUnseenNotifications,
        dropdownRef,
        markAsSeen,
        markAllAsSeen,
        handleOpenUrl
    } = useNotifications();

    return (
        <React.Fragment>
            <Dropdown classNames={{ content: ['rounded p-0 bg-base border border-border'] }}>
                <DropdownTrigger>
                    <div className='flex items-center p-1.5 hover:bg-titlehover rounded-full cursor-pointer relative mr-1' onClick={() => {
                        setShowNotifications(!showNotifications);
                    }}>
                        <IoMdNotificationsOutline fontSize={20} />
                        {unseenNotifications.length > 0 && (
                            <div className='absolute top-0 right-0'>
                                <GoDotFill className='text-danger' />
                            </div>
                        )}
                    </div>
                </DropdownTrigger>

                <DropdownMenu
                    aria-label='notifications'
                    className='w-[350px] max-h-[275px] overflow-y-auto p-0 m-0'
                    classNames={{ list: ['gap-0'] }}
                    ref={dropdownRef}
                >
                    {notifications.length === 0 ? (
                        <DropdownItem textValue='mark-as-seen' className='rounded-none m-0 border-b border-border'>
                            <p className='w-full text-sm text-center my-2'>
                                No notifications
                            </p>
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            textValue='mark-as-seen'
                            className='rounded-none m-0 border-b border-border'
                            onPress={() => markAllAsSeen(notifications, setUnseenNotifications)}
                        >
                            <p className='w-full text-xs my-0.5 pr-3 text-end'>
                                Mark all as read
                            </p>
                        </DropdownItem>
                    )}
                    {notifications.map((notification, index) => (
                        <DropdownItem
                            textValue={notification.title}
                            className='rounded-none m-0 border-b border-border'
                            key={index}
                            onPress={() => handleOpenUrl(notification.url, notification.id, markAsSeen, unseenNotifications, setUnseenNotifications)}
                        >
                            <div className='flex items-center py-0.5 px-1'>
                                {unseenNotifications.some(unseen => unseen.id === notification.id) ? (
                                    <div className='mr-2'>
                                        <GoDotFill fontSize={12} className='text-danger' />
                                    </div>
                                ) : (
                                    <div className='mr-2'>
                                        <IoCheckmark fontSize={14} className='text-green-500' />
                                    </div>
                                )}
                                <div className='flex flex-col gap-0.5 max-w-[300px] my-1'>
                                    <p className={`truncate ${unseenNotifications.some(unseen => unseen.id === notification.id) ? 'font-semibold' : 'font-normal'}`}>
                                        {notification.title}
                                    </p>
                                    <p className='truncate'>
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
}