import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GoDotFill } from 'react-icons/go'
import { TbBell } from 'react-icons/tb'
import { cn } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CustomTooltip } from '@/shared/components/CustomTooltip'
import {
  handleOpenUrl,
  markAllAsSeen,
  timeAgo,
  useNotifications,
} from '@/shared/hooks/notifications/useNotifications'

export function Notifications() {
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
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowNotifications(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownRef, setShowNotifications])

  return (
    <div className='relative'>
      <CustomTooltip content={t('common.notifications')}>
        <div
          className={cn(
            'flex items-center justify-center hover:bg-header-hover/10 h-12 w-12 cursor-pointer active:scale-95 relative duration-150',
          )}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <TbBell
            fontSize={20}
            className={cn(unseenNotifications.length > 0 ? 'text-yellow-400' : 'text-content')}
          />
          {unseenNotifications.length > 0 && (
            <span className='absolute flex justify-center items-center w-4 h-4 top-1 right-2 bg-danger text-white text-[10px] font-bold rounded-full shadow'>
              {unseenNotifications.length}
            </span>
          )}
        </div>
      </CustomTooltip>
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              className='fixed inset-0 bg-black opacity-50 z-998'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              ref={dropdownRef}
              className={cn(
                'absolute right-0 mx-auto mt-3 w-120 p-0 m-0 rounded-xl outline-none z-999 shadow-2xl bg-popover border border-border',
              )}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div
                className={cn(
                  'flex items-center justify-between h-10 rounded-t-xl px-6 border-b border-border sticky top-0 z-999',
                )}
              >
                <span />
                {notifications.length > 0 && (
                  <button
                    className={cn(
                      'text-xs text-altwhite hover:text-content font-semibold cursor-pointer duration-100 py-1 rounded',
                    )}
                    onClick={() => markAllAsSeen(notifications, setUnseenNotifications)}
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>
              <div className='max-h-137.5 overflow-y-auto'>
                {notifications.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16 text-center text-altwhite/85 bg-item-hover/50'>
                    <TbBell size={48} className='mb-2 opacity-30' />
                    <p className='text-sm'>{t('notifications.empty')}</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 w-full border-b last:border-none border-border px-6 py-4 cursor-pointer duration-150',
                        unseenNotifications.some(u => u.id === n.id)
                          ? 'bg-item-active hover:bg-item-hover font-semibold'
                          : 'hover:bg-item-hover',
                      )}
                      onClick={() =>
                        handleOpenUrl(n.url, n.id, unseenNotifications, setUnseenNotifications)
                      }
                    >
                      <GoDotFill
                        className={cn(
                          'min-w-4',
                          unseenNotifications.some(u => u.id === n.id)
                            ? 'text-dynamic'
                            : 'text-content/40',
                        )}
                        fontSize={16}
                      />
                      <div className='flex flex-col gap-1 w-full'>
                        <div className='flex items-center gap-2'>
                          <span className='text-content text-xs font-semibold truncate'>
                            {n.title}
                          </span>
                          <span className='font-normal text-altwhite text-[11px] ml-1 min-w-12'>
                            • {timeAgo(Number(n.timestamp))}
                          </span>
                        </div>
                        <span className='text-xs text-wrap text-altwhite/90'>{n.message}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div
                className={cn(
                  'flex items-center justify-end h-8 rounded-b-xl px-6 border-t border-border sticky bottom-0 z-999',
                )}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
