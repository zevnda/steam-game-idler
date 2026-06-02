import type { SidebarItem } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { FiLogOut } from 'react-icons/fi'
import {
  TbAward,
  TbBuildingStore,
  TbCards,
  TbDeviceGamepad2,
  TbGift,
  TbHeart,
  TbHourglassLow,
  TbPlayerPlay,
  TbSettings,
} from 'react-icons/tb'
import { Button, cn, Divider } from '@heroui/react'
import Image from 'next/image'
import { AdSlot } from '@/shared/components/AdSlot'
import { Beta } from '@/shared/components/Beta'
import { CustomModal } from '@/shared/components/CustomModal'
import { Brand } from '@/shared/components/titlebar/Brand'
import { useSidebar } from '@/shared/hooks/sidebar/useSidebar'
import { useSessionStore, useUiStore, useUserStore } from '@/shared/stores'

export function Sidebar() {
  const { t } = useTranslation()
  const activePage = useUiStore(s => s.activePage)
  const previousActivePage = useUiStore(s => s.previousActivePage)
  const setActivePage = useUiStore(s => s.setActivePage)
  const setPreviousActivePage = useUiStore(s => s.setPreviousActivePage)
  const freeGamesList = useUserStore(s => s.freeGamesList)
  const userSummary = useUserStore(s => s.userSummary)
  const idleGamesList = useSessionStore(s => s.idleGamesList)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const isCardFarming = useSessionStore(s => s.isCardFarming)
  const isAchievementUnlocker = useSessionStore(s => s.isAchievementUnlocker)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const setSelectedGame = useUiStore(s => s.setSelectedGame)
  const setAchievementOrderGame = useUiStore(s => s.setAchievementOrderGame)
  const { isOpen, onOpenChange, openConfirmation, handleLogout } = useSidebar(
    activePage,
    setActivePage,
  )

  const effectivePage = activePage === 'settings' ? previousActivePage : activePage

  const items: SidebarItem[] = [
    { id: 'games', page: 'games', title: t('gamesList.title'), icon: TbDeviceGamepad2 },
    {
      id: 'idling',
      page: 'idling',
      title: t('idlingGames.title'),
      icon: TbPlayerPlay,
      isActive: idleGamesList.length > 0,
      customClassName: idleGamesList.length > 0 ? 'text-dynamic animate-pulse' : '',
    },
    {
      id: 'favorites',
      page: 'customlists/favorites',
      title: t('customLists.favorites.title'),
      icon: TbHeart,
    },
    { id: 'free-games', page: 'freeGames', title: t('freeGames.title'), icon: TbGift },
    {
      id: 'card-farming',
      page: 'customlists/card-farming',
      title: t('common.cardFarming'),
      icon: TbCards,
      isActive: isCardFarming,
      customClassName: isCardFarming ? 'text-dynamic animate-pulse' : '',
    },
    {
      id: 'achievement-unlocker',
      page: 'customlists/achievement-unlocker',
      title: t('common.achievementUnlocker'),
      icon: TbAward,
      isActive: isAchievementUnlocker,
      customClassName: isAchievementUnlocker ? 'text-dynamic animate-pulse' : '',
    },
    {
      id: 'auto-idle',
      page: 'customlists/auto-idle',
      title: t('customLists.autoIdle.title'),
      icon: TbHourglassLow,
    },
    {
      id: 'inventory-manager',
      page: 'inventoryManager',
      title: t('tradingCards.title'),
      icon: TbBuildingStore,
    },
  ]

  const sectionHeaders: Record<number, string> = {
    0: t('sidebar.section.games'),
    4: t('sidebar.section.automation'),
    7: t('sidebar.section.misc'),
  }

  const renderHeader = (index: number) => {
    const header = sectionHeaders[index]
    if (!header) return null
    if (sidebarCollapsed) return <Divider className='w-full bg-border/60 mt-0.5 mb-2' />
    return (
      <div
        className={cn(
          'px-4 py-1 mb-0 text-[12px] font-bold text-content uppercase tracking-wider select-none transition-all ease-in-out whitespace-nowrap truncate',
          header !== t('sidebar.section.games') ? 'mt-4' : 'mt-0',
        )}
      >
        {header}
      </div>
    )
  }

  const renderItem = (item: SidebarItem, index: number) => {
    const Icon = item.icon
    const isCurrent = effectivePage === item.page
    const isFreeGames = item.id === 'free-games'
    const hasFreeGames = freeGamesList.length > 0

    return (
      <div key={item.id}>
        {renderHeader(index)}
        <div className='flex w-full'>
          {!sidebarCollapsed && (
            <div
              className={cn(
                'mr-2 shrink-0 self-center rounded-r-md transition-transform duration-150 w-1.5 h-7',
                isCurrent ? 'bg-dynamic scale-y-100' : 'scale-y-0',
              )}
              aria-hidden
            />
          )}
          <div
            className={cn(
              'px-1.5 py-1.5 rounded-lg duration-150 cursor-pointer active:scale-95 w-full overflow-hidden',
              isCurrent
                ? sidebarCollapsed
                  ? 'bg-dynamic/10 text-dynamic'
                  : 'bg-linear-to-r from-dynamic/20 via-dynamic/2 to-dynamic/0 text-dynamic'
                : 'text-altwhite hover:bg-item-hover',
              item.customClassName,
            )}
            onClick={() => {
              setSelectedGame(null)
              setAchievementOrderGame(null)
              setActivePage(item.page)
            }}
          >
            <div
              className={cn(
                'flex items-center gap-3 transition-all duration-150 ease-in-out',
                sidebarCollapsed ? 'justify-center' : 'justify-start',
              )}
            >
              <div className='relative shrink-0'>
                <Icon
                  fontSize={20}
                  className={isFreeGames && hasFreeGames ? 'text-[#ffc700]' : undefined}
                />
              </div>
              {!sidebarCollapsed && (
                <div
                  className={cn('transition-all duration-150 ease-in-out min-w-0 overflow-hidden')}
                >
                  <p
                    className={cn(
                      'flex items-center gap-1 text-sm font-bold',
                      isFreeGames && hasFreeGames ? 'text-[#ffc700]' : undefined,
                    )}
                  >
                    <span className='truncate'>{item.title}</span>
                    {item.isBeta && <Beta />}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'relative flex flex-col h-screen z-40 bg-sidebar/90 border-r border-border select-none ease-in-out',
          sidebarCollapsed ? 'min-w-14 max-w-14' : 'min-w-62.5 max-w-62.5',
        )}
        style={{ transitionDuration, transitionProperty: 'min-width, max-width' }}
      >
        <div
          className={cn(
            'flex flex-col gap-1.5 p-2 w-full min-w-0',
            sidebarCollapsed ? 'items-center' : undefined,
          )}
        >
          <Brand />
        </div>
        <div
          className={cn(
            'flex flex-col gap-1 p-2 w-full min-w-0 overflow-y-auto',
            !sidebarCollapsed ? 'pl-0' : undefined,
          )}
        >
          {items.map((item, idx) => renderItem(item, idx))}
        </div>
        {process.env.NODE_ENV === 'production' && (
          <div className='absolute bottom-8 left-0 right-0 flex flex-col items-center justify-end grow mb-1 overflow-hidden pointer-events-none'>
            <AdSlot />
          </div>
        )}
        <div
          className={cn(
            'flex items-center mt-auto w-full rounded-t-xl py-2 px-1.5',
            sidebarCollapsed ? 'justify-center flex-col gap-2 pt-3' : 'justify-start',
          )}
        >
          <div
            className={cn(
              'flex items-center w-full bg-item-active p-2 min-h-12.5 rounded-lg',
              sidebarCollapsed ? 'flex-col gap-2' : 'flex-row gap-3',
            )}
          >
            <div className={cn('relative shrink-0', sidebarCollapsed ? 'w-7 h-7' : 'w-8 h-8')}>
              <Image
                src={userSummary?.avatar || ''}
                alt={userSummary?.personaName || 'User Avatar'}
                width={sidebarCollapsed ? 28 : 32}
                height={sidebarCollapsed ? 28 : 32}
                className='rounded-full bg-white'
              />
            </div>
            {!sidebarCollapsed && (
              <div className='flex items-center justify-between w-full overflow-hidden'>
                <div className='flex flex-col overflow-hidden'>
                  <p className='text-sm leading-tight truncate whitespace-nowrap'>
                    {userSummary?.personaName}
                  </p>
                  <p className='text-[10px] text-altwhite/70 leading-tight truncate whitespace-nowrap'>
                    {userSummary?.steamId}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={cn(
                      'text-altwhite hover:bg-white/7 rounded-full p-1.5 duration-150',
                      isCardFarming || isAchievementUnlocker
                        ? 'opacity-40 hover:bg-transparent hover:shadow-none'
                        : 'cursor-pointer active:scale-95',
                    )}
                    onClick={
                      !(isCardFarming || isAchievementUnlocker)
                        ? () => {
                            setSelectedGame(null)
                            setAchievementOrderGame(null)
                            setPreviousActivePage(activePage)
                            setActivePage('settings')
                          }
                        : undefined
                    }
                  >
                    <TbSettings fontSize={20} />
                  </div>
                  <div
                    className={cn(
                      'text-altwhite rounded-full p-1.5 duration-150',
                      isCardFarming || isAchievementUnlocker
                        ? 'opacity-40'
                        : 'hover:bg-danger/20 hover:text-danger cursor-pointer active:scale-95',
                    )}
                    onClick={
                      !(isCardFarming || isAchievementUnlocker) ? openConfirmation : undefined
                    }
                  >
                    <FiLogOut fontSize={18} />
                  </div>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className='flex flex-col items-center gap-2'>
                <div
                  className={cn(
                    'text-altwhite hover:bg-white/7 rounded-full p-1.5 duration-150',
                    isCardFarming || isAchievementUnlocker
                      ? 'opacity-40 hover:bg-transparent hover:shadow-none'
                      : 'cursor-pointer active:scale-95',
                  )}
                  onClick={
                    !(isCardFarming || isAchievementUnlocker)
                      ? () => {
                          setSelectedGame(null)
                          setAchievementOrderGame(null)
                          setActivePage('settings')
                        }
                      : undefined
                  }
                >
                  <TbSettings fontSize={20} />
                </div>
                <div
                  className={cn(
                    'text-altwhite rounded-full p-1.5 duration-150',
                    isCardFarming || isAchievementUnlocker
                      ? 'opacity-40'
                      : 'hover:bg-danger/20 hover:text-danger cursor-pointer active:scale-95',
                  )}
                  onClick={!(isCardFarming || isAchievementUnlocker) ? openConfirmation : undefined}
                >
                  <FiLogOut fontSize={18} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={t('confirmation.logout')}
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                setSelectedGame(null)
                setAchievementOrderGame(null)
                handleLogout(onOpenChange)
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
