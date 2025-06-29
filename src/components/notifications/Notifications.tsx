import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GoDotFill } from 'react-icons/go'
import { TbBell } from 'react-icons/tb'

import CustomTooltip from '@/components/ui/CustomTooltip'
import { handleOpenUrl, markAllAsSeen, timeAgo, useNotifications } from '@/hooks/notifications/useNotifications'

export default function Notifications(): ReactElement {
  const { t } = useTranslation()
  const {
    notifications,
    showNotifications,
    setShowNotifications,
    unseenNotifications,
    setUnseenNotifications,
    dropdownRef,
  } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef, setShowNotifications])

  return (
    <div className='relative'>
      <CustomTooltip content={t('common.notifications')}>
        <div
          className={cn(
            'flex items-center p-1.5 hover:bg-titlehover rounded-lg',
            'cursor-pointer active:scale-95 relative duration-200 transition-all ease-out',
            'hover:shadow-sm',
            showNotifications && 'bg-titlehover/40',
          )}
          onClick={() => {
            setShowNotifications(!showNotifications)
          }}
        >
          <TbBell fontSize={20} className={cn(unseenNotifications.length > 0 && 'text-yellow-500')} />
          {unseenNotifications.length > 0 && (
            <div className='absolute top-0.5 right-0.5'>
              <GoDotFill className='text-danger' fontSize={16} />
            </div>
          )}
        </div>
      </CustomTooltip>
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              className='fixed inset-0 bg-black opacity-50 z-[998]'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
            />{' '}
            <motion.div
              ref={dropdownRef}
              className={cn(
                'absolute right-0 mx-auto mt-3 w-[380px] p-0 m-0 rounded-xl',
                'bg-modalbody/95 backdrop-blur-md border border-border/50 outline-none z-[999]',
                'shadow-2xl',
              )}
              initial={{
                opacity: 0,
                y: -10,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -10,
                scale: 0.95,
              }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
              }}
            >
              {notifications.length === 0 ? (
                <div
                  className={cn(
                    'flex items-center h-8 rounded-xl p-8 border-b border-border',
                    'sticky top-0 bg-modalheader z-[999] cursor-default',
                  )}
                >
                  <p className='w-full text-sm text-center'>{t('notifications.empty')}</p>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center h-8 rounded-t-xl py-4 px-6 border-b',
                    'border-border sticky top-0 bg-modalheader z-[999] cursor-default',
                  )}
                >
                  <div className='flex justify-end w-full'>
                    <p
                      className={cn(
                        'text-xs text-altwhite hover:text-content',
                        'font-semibold my-0.5 cursor-pointer duration-100',
                      )}
                      onClick={() => markAllAsSeen(notifications, setUnseenNotifications)}
                    >
                      {t('notifications.markAllRead')}
                    </p>
                  </div>
                </div>
              )}
              <div className='max-h-[450px] overflow-y-auto'>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      'rounded-none m-0 border-b last:border-none border-border',
                      'cursor-pointer px-6 py-3 hover:bg-modalbody-hover',
                      unseenNotifications.some(unseen => unseen.id === notification.id)
                        ? 'bg-modalbody-hover font-semibold'
                        : 'bg-modalbody',
                    )}
                    onClick={() =>
                      handleOpenUrl(notification.url, notification.id, unseenNotifications, setUnseenNotifications)
                    }
                  >
                    <div className='flex items-center gap-4 py-0.5'>
                      <div className='flex flex-col gap-0.5 max-w-[300px]'>
                        <p className='text-xs font-semibold'>
                          {notification.title}
                          <span className='font-normal text-altwhite ml-1'>
                            • {timeAgo(Number(notification.timestamp))}
                          </span>
                        </p>
                        <p className='text-xs text-wrap text-altwhite'>{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length !== 0 && (
                <div
                  className={cn(
                    'flex items-center h-8 rounded-b-xl px-6 border-t',
                    'border-border sticky bottom-0 bg-modalfooter z-[999] cursor-default',
                  )}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
