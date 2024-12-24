import React, { useEffect } from 'react';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { useNotifications } from '../hooks/useNotifications';
import { GoDotFill } from 'react-icons/go';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '../utils/notificationsHandler';

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

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <React.Fragment>
            <div className='relative'>
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
                <AnimatePresence>
                    {showNotifications && (
                        <React.Fragment>
                            <motion.div
                                className='fixed inset-0 bg-black opacity-50 z-[998]'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowNotifications(false)}
                            />
                            <motion.div
                                ref={dropdownRef}
                                className='absolute right-0 mx-auto mt-2 w-[350px] max-h-[450px] overflow-y-auto scrollbar-hide p-0 m-0 rounded-xl bg-notibase border-none outline-none z-[999] shadow-xl'
                                initial={{
                                    opacity: 0, y: -5,
                                    scale: 0.9
                                }}
                                animate={{
                                    opacity: 1, y: 0,
                                    scale: 1
                                }}
                                exit={{
                                    opacity: 0, y: -5,
                                    scale: 0.9
                                }}
                            >
                                {notifications.length === 0 ? (
                                    <div className='flex items-center h-8 rounded-none p-8 border-b border-border sticky top-0 bg-notihead z-[999] cursor-default'>
                                        <p className='w-full text-sm text-center'>
                                            No notifications
                                        </p>
                                    </div>
                                ) : (
                                    <div className='flex items-center h-8 rounded-none py-4 px-6 border-b border-border sticky top-0 bg-notihead z-[999] cursor-default'>
                                        <div className='flex justify-end w-full'>
                                            <p
                                                className='text-xs text-altwhite hover:text-black dark:hover:text-offwhite font-semibold my-0.5 cursor-pointer duration-100'
                                                onClick={() => markAllAsSeen(notifications, setUnseenNotifications)}
                                            >
                                                Mark all as read
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {notifications.map((notification, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-none m-0 border-b last:border-none border-border cursor-pointer px-6 py-3 hover:bg-notihover ${unseenNotifications.some(unseen => unseen.id === notification.id) ? 'bg-notiunread font-semibold' : 'bg-notibase'}`}
                                        onClick={() => handleOpenUrl(notification.url, notification.id, markAsSeen, unseenNotifications, setUnseenNotifications)}
                                    >
                                        <div className='flex items-center gap-4 py-0.5'>
                                            <div className='flex flex-col gap-0.5 max-w-[300px]'>
                                                <p className='text-xs font-semibold'>
                                                    {notification.title}
                                                    <span className='font-normal text-altwhite ml-1'>
                                                        • {timeAgo(notification.timestamp)}
                                                    </span>
                                                </p>
                                                <p className='text-xs text-wrap text-altwhite'>
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length !== 0 && (
                                    <div className='flex items-center h-4 rounded-none px-6 border-t border-border sticky bottom-0 bg-notihead z-[999] cursor-default'></div>
                                )}
                            </motion.div>
                        </React.Fragment>
                    )}
                </AnimatePresence>
            </div>
        </React.Fragment>
    );
}