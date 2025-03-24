import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoDotFill } from 'react-icons/go';
import { TbBell } from 'react-icons/tb';

import { handleOpenUrl, markAllAsSeen, timeAgo, useNotifications } from '@/hooks/notifications/useNotifications';

export default function Notifications() {
    const { t } = useTranslation();
    const {
        notifications,
        showNotifications,
        setShowNotifications,
        unseenNotifications,
        setUnseenNotifications,
        dropdownRef,
    } = useNotifications();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef, setShowNotifications]);

    return (
        <div className='relative'>
            <div
                className={`flex items-center p-2 hover:bg-titlehover rounded-full cursor-pointer active:scale-90 relative duration-200 ${showNotifications && 'bg-titlehover'}`}
                onClick={() => {
                    setShowNotifications(!showNotifications);
                }}
            >
                <TbBell fontSize={20} />
                {unseenNotifications.length > 0 && (
                    <div className='absolute top-1 right-1'>
                        <GoDotFill className='text-danger' />
                    </div>
                )}
            </div>
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div
                            className='fixed inset-0 bg-black opacity-50 z-[998]'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                        />
                        <motion.div
                            ref={dropdownRef}
                            className='absolute right-0 mx-auto mt-2 w-[350px] p-0 m-0 rounded-xl bg-notibase border-none outline-none z-[999] shadow-xl'
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
                                <div className='flex items-center h-8 rounded-xl p-8 border-b border-border sticky top-0 bg-notihead z-[999] cursor-default'>
                                    <p className='w-full text-sm text-center'>
                                        {t('notifications.empty')}
                                    </p>
                                </div>
                            ) : (
                                <div className='flex items-center h-8 rounded-t-xl py-4 px-6 border-b border-border sticky top-0 bg-notihead z-[999] cursor-default'>
                                    <div className='flex justify-end w-full'>
                                        <p
                                            className='text-xs text-altwhite hover:text-content dark:hover:text-offwhite font-semibold my-0.5 cursor-pointer duration-100'
                                            onClick={() => markAllAsSeen(notifications, setUnseenNotifications)}
                                        >
                                            {t('notifications.markAllRead')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className='max-h-[450px] overflow-y-auto'>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`rounded-none m-0 border-b last:border-none border-border cursor-pointer px-6 py-3 hover:bg-notihover ${unseenNotifications.some(unseen => unseen.id === notification.id) ? 'bg-notiunread font-semibold' : 'bg-notibase'}`}
                                        onClick={() => handleOpenUrl(notification.url, notification.id, unseenNotifications, setUnseenNotifications)}
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
                            </div>
                            {notifications.length !== 0 && (
                                <div className='flex items-center h-4 rounded-b-xl px-6 border-t border-border sticky bottom-0 bg-notihead z-[999] cursor-default' />
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}