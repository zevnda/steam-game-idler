import type { TranslationKey } from '@/i18n'
import type { AppNotification } from '@/shared/hooks/useNotifications'
import type { IconType } from 'react-icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TbAlertTriangle,
  TbBell,
  TbBellOff,
  TbChecks,
  TbChevronDown,
  TbExternalLink,
  TbFlask,
  TbGift,
  TbPackage,
  TbSpeakerphone,
} from 'react-icons/tb'
import {
  Badge,
  cn,
  Popover,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabsRoot,
} from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { CountChip } from '@/shared/components/dashboard/PageToolbar'
import { timeAgo, useNotifications } from '@/shared/hooks/useNotifications'

type NotificationsTab = 'unread' | 'read'

interface NotificationTypeStyle {
  icon: IconType
  labelKey: TranslationKey
  className: string
}

// notifications.json's optional `type` -> icon, label and tint. Anything missing or unknown
// (an older feed entry, or a type added to the feed after this build shipped) gets FALLBACK_TYPE.
const NOTIFICATION_TYPES: Record<string, NotificationTypeStyle> = {
  update: {
    icon: TbPackage,
    labelKey: 'notifications.types.update',
    className: 'bg-accent/15 text-accent',
  },
  issue: {
    icon: TbAlertTriangle,
    labelKey: 'notifications.types.issue',
    className: 'bg-warning/15 text-warning',
  },
  giveaway: {
    icon: TbGift,
    labelKey: 'notifications.types.giveaway',
    className: 'bg-pink-500/15 text-pink-400',
  },
  testing: {
    icon: TbFlask,
    labelKey: 'notifications.types.testing',
    className: 'bg-violet-500/15 text-violet-400',
  },
  news: {
    icon: TbSpeakerphone,
    labelKey: 'notifications.types.news',
    className: 'bg-success/15 text-success',
  },
}

const FALLBACK_TYPE: NotificationTypeStyle = {
  icon: TbBell,
  labelKey: 'notifications.types.announcement',
  className: 'bg-default text-muted',
}

const typeStyleOf = (notification: AppNotification) =>
  (notification.type && NOTIFICATION_TYPES[notification.type]) || FALLBACK_TYPE

// Titlebar bell icon - fetches a small remote notifications feed (see useNotifications.ts), no
// tier gating. Popover rather than main's hand-rolled `framer-motion` overlay, matching this
// rewrite's other titlebar/sidebar dropdowns (see AccountSwitcher.tsx) - HeroUI v3's Popover
// already handles its own enter/exit animation and outside-click dismissal.
//
// Unread / Read tabs over compact rows that expand in place to show the full message, with an
// explicit Open button for the link. Rows used to open the browser on click; expanding first
// means a user can read a notification without leaving the app. Expanding a row counts as
// reading it.
export const Notifications = () => {
  const { t, i18n } = useTranslation()
  const { notifications, unseen, markSeen, markAllSeen, openNotification } = useNotifications()
  const [tab, setTab] = useState<NotificationsTab>('unread')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // The Unread tab lists what was unread when the popover opened, not live - otherwise expanding a
  // row (which marks it read) would make it vanish from under the cursor mid-read. The live state
  // still drives each row's dot and the tab's count. Re-taken on every open and tab switch, so a
  // row read on Unread moves over to Read (which is live) as soon as you switch tabs.
  const [unreadAtOpen, setUnreadAtOpen] = useState<string[]>([])

  const isUnseen = (id: string) => unseen.some(entry => entry.id === id)
  const visible =
    tab === 'unread'
      ? notifications.filter(notification => unreadAtOpen.includes(notification.id))
      : notifications.filter(notification => !isUnseen(notification.id))

  // Reset per open (a deliberate reset, not persist): land on Unread when there's something new,
  // otherwise straight on Read, with every row collapsed.
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) return
    const ids = unseen.map(entry => entry.id)
    setUnreadAtOpen(ids)
    setTab(ids.length > 0 ? 'unread' : 'read')
    setExpandedId(null)
  }

  // Unlike expanding one row, this is an explicit "clear my inbox" - so the Unread tab's snapshot
  // empties too (straight to its caught-up state) instead of keeping the rows around until the
  // next open.
  const handleMarkAllSeen = () => {
    markAllSeen()
    setUnreadAtOpen([])
    setExpandedId(null)
  }

  const toggle = (notification: AppNotification) => {
    if (expandedId === notification.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(notification.id)
    markSeen(notification.id)
  }

  const renderEmpty = (title: string, description?: string) => (
    <div className='flex flex-col items-center justify-center gap-3 px-6 py-12 text-center'>
      <span className='flex size-14 items-center justify-center rounded-full bg-default text-muted'>
        <TbBellOff fontSize={26} />
      </span>
      <span className='flex flex-col gap-1'>
        <span className='text-sm font-semibold text-foreground'>{title}</span>
        {description && <span className='text-xs text-muted'>{description}</span>}
      </span>
    </div>
  )

  return (
    <Popover.Root onOpenChange={handleOpenChange}>
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
        <Popover.Dialog className='flex w-100 max-w-[90vw] flex-col overflow-hidden rounded-[inherit] p-0'>
          <div className='flex shrink-0 flex-col gap-3 border-b border-border px-4 pt-3.5 pb-3'>
            <div className='flex min-h-7 items-center gap-2'>
              <span className='text-sm font-semibold text-foreground'>
                {t('common.notifications')}
              </span>
              {unseen.length > 0 && (
                <button
                  className='ml-auto inline-flex h-7 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted outline-none transition-colors hover:bg-default hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus'
                  type='button'
                  onClick={handleMarkAllSeen}
                >
                  <TbChecks fontSize={14} />
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            {notifications.length > 0 && (
              <TabsRoot
                selectedKey={tab}
                onSelectionChange={key => {
                  setTab(key as NotificationsTab)
                  setExpandedId(null)
                  // Leaving a tab is a natural point to settle what's been read - re-snapshot
                  // so anything read meanwhile is gone from Unread when you come back to it.
                  setUnreadAtOpen(unseen.map(entry => entry.id))
                }}
              >
                <TabListContainer>
                  <TabList className='w-full'>
                    <Tab className='flex-1 gap-2' id='unread'>
                      {t('notifications.unread')}
                      {unseen.length > 0 && <CountChip count={unseen.length} />}
                      <TabIndicator />
                    </Tab>
                    <Tab className='flex-1' id='read'>
                      {t('notifications.read')}
                      <TabIndicator />
                    </Tab>
                  </TabList>
                </TabListContainer>
              </TabsRoot>
            )}
          </div>

          <div className='max-h-105 overflow-y-auto'>
            {notifications.length === 0
              ? renderEmpty(t('notifications.empty'))
              : visible.length === 0
                ? tab === 'unread'
                  ? renderEmpty(t('notifications.caughtUp'), t('notifications.caughtUpDescription'))
                  : renderEmpty(t('notifications.noneRead'), t('notifications.noneReadDescription'))
                : visible.map(notification => {
                    const isExpanded = expandedId === notification.id
                    const unread = isUnseen(notification.id)
                    const typeStyle = typeStyleOf(notification)
                    const TypeIcon = typeStyle.icon
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'border-b border-border/50 transition-colors duration-200 last:border-none',
                          isExpanded && 'bg-surface/70',
                        )}
                      >
                        <button
                          aria-expanded={isExpanded}
                          className='flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover'
                          type='button'
                          onClick={() => toggle(notification)}
                        >
                          <span
                            className={cn(
                              'flex size-7.5 shrink-0 items-center justify-center rounded-full',
                              typeStyle.className,
                            )}
                          >
                            <TypeIcon fontSize={15} />
                          </span>
                          <span className='flex min-w-0 flex-1 flex-col'>
                            <span
                              className={cn(
                                'text-[13px]',
                                // Collapsed rows stay one line; the full title shows once expanded.
                                !isExpanded && 'truncate',
                                unread
                                  ? 'font-semibold text-foreground'
                                  : 'font-medium text-foreground/80',
                              )}
                            >
                              {notification.title}
                            </span>
                            <span className='flex items-center gap-1.5 text-[11px] text-muted'>
                              {t(typeStyle.labelKey)}
                              <span className='size-0.75 shrink-0 rounded-full bg-muted' />
                              {timeAgo(Number(notification.timestamp), i18n.language)}
                            </span>
                          </span>
                          {unread && <span className='size-2 shrink-0 rounded-full bg-accent' />}
                          <TbChevronDown
                            className={cn(
                              'shrink-0 text-muted transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                            fontSize={16}
                          />
                        </button>

                        {/* Always mounted so it can animate both ways: the 0fr -> 1fr grid row
                            grows to the content's real height (no hardcoded max-height to guess
                            at), with a fade on top. `inert` keeps the collapsed Open link button
                            out of the tab order and away from screen readers. */}
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
                            isExpanded
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'grid-rows-[0fr] opacity-0',
                          )}
                          inert={!isExpanded}
                        >
                          {/* `pl-14.5` lines the message up under the title, past the type icon.
                              The bottom padding lives inside the clipped box so it collapses too. */}
                          <div className='flex min-h-0 flex-col gap-3 overflow-hidden pr-4 pl-14.5'>
                            <p className='text-xs leading-relaxed text-wrap text-foreground/75'>
                              {notification.message}
                            </p>
                            <div className='flex min-w-0 items-center gap-2'>
                              <button
                                className='inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-default px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-focus'
                                type='button'
                                onClick={() => openNotification(notification)}
                              >
                                {t('notifications.open')}
                                <TbExternalLink fontSize={13} />
                              </button>
                            </div>
                            <span className='h-0.5 shrink-0' />
                          </div>
                        </div>
                      </div>
                    )
                  })}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  )
}
