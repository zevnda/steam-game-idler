import { useTranslation } from 'react-i18next'
import { GoDotFill } from 'react-icons/go'
import { TbBell } from 'react-icons/tb'
import { Badge, cn, Popover } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { timeAgo, useNotifications } from '@/shared/hooks/useNotifications'

// Titlebar bell icon - fetches a small remote notifications feed (see useNotifications.ts), no
// tier gating. Popover rather than main's hand-rolled `framer-motion` overlay, matching this
// rewrite's other titlebar/sidebar dropdowns (see AccountSwitcher.tsx) - HeroUI v3's Popover
// already handles its own enter/exit animation and outside-click dismissal.
export const Notifications = () => {
  const { t } = useTranslation()
  const { notifications, unseen, markAllSeen, openNotification } = useNotifications()

  return (
    <Popover.Root>
      <AppTooltip.Root delay={300}>
        <AppTooltip.Trigger>
          <Popover.Trigger
            aria-label={t('common.notifications')}
            className='flex h-14 w-12 items-center justify-center text-foreground outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
          >
            <Badge.Anchor>
              <TbBell fontSize={18} />
              {unseen.length > 0 && (
                <Badge color='danger' placement='top-right' size='sm'>
                  <Badge.Label>{unseen.length}</Badge.Label>
                </Badge>
              )}
            </Badge.Anchor>
          </Popover.Trigger>
        </AppTooltip.Trigger>
        <AppTooltip.Content placement='bottom'>{t('common.notifications')}</AppTooltip.Content>
      </AppTooltip.Root>

      <Popover.Content placement='bottom'>
        <Popover.Dialog className='flex w-96 flex-col overflow-hidden rounded-[inherit] p-0'>
          <div className='flex h-10 shrink-0 items-center justify-end border-b border-border px-4'>
            {notifications.length > 0 && (
              <button
                className='text-xs font-semibold text-muted outline-none transition-colors hover:text-foreground'
                type='button'
                onClick={markAllSeen}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className='max-h-100 overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-2 py-12 text-center text-muted'>
                <TbBell size={40} className='opacity-30' />
                <span className='text-sm'>{t('notifications.empty')}</span>
              </div>
            ) : (
              notifications.map(notification => {
                const isUnseen = unseen.some(entry => entry.id === notification.id)
                return (
                  <button
                    key={notification.id}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left outline-none last:border-none',
                      'transition-colors hover:bg-surface-hover cursor-pointer',
                      isUnseen && 'bg-surface-tertiary/30 hover:bg-surface-hover',
                    )}
                    type='button'
                    onClick={() => openNotification(notification)}
                  >
                    <GoDotFill
                      className={cn('mt-1 shrink-0', isUnseen ? 'text-accent' : 'text-muted/40')}
                      fontSize={14}
                    />
                    <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate text-xs font-semibold text-foreground'>
                          {notification.title}
                        </span>
                        <span className='shrink-0 text-[11px] text-muted'>
                          • {timeAgo(Number(notification.timestamp))}
                        </span>
                      </div>
                      <span className='text-xs text-wrap text-muted'>{notification.message}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  )
}
