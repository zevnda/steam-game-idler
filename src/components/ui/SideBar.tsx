import type { SidebarItem } from '@/types/navigation'
import type { ReactElement } from 'react'

import { Button, cn, Divider } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiLogOut } from 'react-icons/fi'
import { RiChatSmile2Line, RiSearchLine } from 'react-icons/ri'
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

import { useIdleContext } from '@/components/contexts/IdleContext'
import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useSearchContext } from '@/components/contexts/SearchContext'
import { useStateContext } from '@/components/contexts/StateContext'
import AdSlot from '@/components/ui/AdSlot'
import Beta from '@/components/ui/Beta'
import CustomModal from '@/components/ui/CustomModal'
import HeaderTitle from '@/components/ui/header/HeaderTitle'
import SearchBar from '@/components/ui/SearchBar'
import useSideBar from '@/hooks/ui/useSideBar'

export default function SideBar(): ReactElement {
  // (All context and state hooks are declared below, only once)

  const { t } = useTranslation()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const { idleGamesList } = useIdleContext()
  const {
    sidebarCollapsed,
    showFreeGamesTab,
    isCardFarming,
    isAchievementUnlocker,
    setShowAchievements,
    transitionDuration,
  } = useStateContext()
  const { activePage, setActivePage } = useNavigationContext()
  const searchContent = useSearchContext()
  const {
    isOpen,
    onOpenChange,
    openConfirmation,
    handleLogout,
    hasUnreadChat,
    setHasUnreadChat,
    hasBeenMentionedSinceLastRead,
  } = useSideBar(activePage, setActivePage)

  // When user navigates to chat, update last read and reset unread
  useEffect(() => {
    if (activePage === 'chat') {
      localStorage.setItem('chatLastRead', new Date().toISOString())
      setHasUnreadChat(false)
    }
  }, [activePage, setHasUnreadChat])

  const mainSidebarItems: SidebarItem[] = [
    {
      id: 'games',
      page: 'games',
      title: t('gamesList.title'),
      icon: TbDeviceGamepad2,
    },
    {
      id: 'idling',
      page: 'idling',
      title: t('idlingGames.title'),
      icon: TbPlayerPlay,
      isActive: idleGamesList.length > 0,
      customClassName: idleGamesList.length > 0 ? 'text-dynamic animate-pulse' : '',
      hasDivider: true,
    },
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
      id: 'favorites',
      page: 'customlists/favorites',
      title: t('customLists.favorites.title'),
      icon: TbHeart,
    },
    {
      id: 'trading-cards',
      page: 'tradingCards',
      title: t('tradingCards.title'),
      icon: TbBuildingStore,
      hasDivider: true,
    },
    {
      id: 'chat',
      page: 'chat',
      title: t('chat.title'),
      icon: RiChatSmile2Line,
      isBeta: true,
      hasUnread: hasUnreadChat,
    },
    {
      id: 'free-games',
      page: 'freeGames',
      title: t('freeGames.title'),
      icon: TbGift,
      shouldShow: showFreeGamesTab,
      customClassName: 'text-[#ffc700]',
      hasDivider: true,
    },
  ]

  const renderSidebarItem = (item: SidebarItem): ReactElement | null => {
    if (item.shouldShow === false) return null

    const Icon = item.icon
    const isCurrentPage = activePage === item.page
    const isFreeGames = item.id === 'free-games'
    const isBeta = item.isBeta
    const isChat = item.id === 'chat'

    return (
      <div className='overflow-hidden' key={item.id}>
        {item.hasDivider && <Divider className='w-full bg-border/60 mt-0.5 mb-2' />}

        <div className='flex w-full'>
          <div
            className={cn(
              'p-1.5 rounded-lg duration-150 cursor-pointer active:scale-95 border border-transparent w-full overflow-hidden',
              isCurrentPage ? 'bg-item-active text-content' : 'text-altwhite hover:bg-item-hover',
              item.customClassName,
            )}
            onClick={() => {
              setShowAchievements(false)
              setActivePage(item.page)
            }}
          >
            <div
              className={cn(
                'flex items-center gap-3 transition-all duration-500 ease-in-out',
                sidebarCollapsed ? 'justify-center' : 'justify-start',
              )}
            >
              <div className='relative shrink-0'>
                <Icon fontSize={20} className={isFreeGames ? 'text-[#ffc700]' : undefined} />
                {isChat && item.hasUnread && (
                  <span
                    className={cn(
                      'absolute flex justify-center items-center w-2 h-2 top-0 right-0 text-white text-[10px] font-bold rounded-full shadow',
                      hasBeenMentionedSinceLastRead ? 'bg-[#ffc700]' : 'bg-danger',
                    )}
                  />
                )}
              </div>
              {!sidebarCollapsed && (
                <div className={cn('transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap')}>
                  <p className={cn('text-sm font-bold', isFreeGames ? 'text-[#ffc700]' : undefined)}>
                    {item.title}
                    {isBeta && <Beta />}
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
          'relative flex flex-col h-screen z-40 bg-sidebar/40 select-none ease-in-out',
          sidebarCollapsed ? 'min-w-14 max-w-14' : 'min-w-[250px] max-w-[250px]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'min-width, max-width',
        }}
      >
        <div
          className={cn(
            'flex flex-col gap-1.5 p-2 w-full min-w-0 overflow-hidden',
            sidebarCollapsed ? 'items-center' : undefined,
          )}
        >
          <HeaderTitle />

          <Button
            isIconOnly={sidebarCollapsed}
            radius='full'
            isDisabled={
              activePage === 'idling' ||
              activePage === 'freeGames' ||
              activePage === 'chat' ||
              activePage.includes('customlists')
            }
            className={cn(
              'text-altwhite active:scale-95 w-full mt-4 duration-150',
              sidebarCollapsed ? 'w-0 justify-center' : 'min-w-40 justify-start',
              searchContent.gameQueryValue ||
                searchContent.tradingCardQueryValue ||
                searchContent.achievementQueryValue ||
                searchContent.statisticQueryValue
                ? 'bg-dynamic/10 hover:bg-dynamic/20'
                : 'bg-search',
            )}
            onPress={() => setShowSearchModal(true)}
          >
            <RiSearchLine
              fontSize={20}
              className={cn(
                searchContent.gameQueryValue ||
                  searchContent.tradingCardQueryValue ||
                  searchContent.achievementQueryValue ||
                  searchContent.statisticQueryValue
                  ? 'text-dynamic'
                  : undefined,
              )}
            />
            {!sidebarCollapsed && (
              <div>
                {searchContent.gameQueryValue ? (
                  <p className='text-sm text-dynamic font-bold'>{searchContent.gameQueryValue}</p>
                ) : searchContent.tradingCardQueryValue ? (
                  <p className='text-sm text-dynamic font-bold'>{searchContent.tradingCardQueryValue}</p>
                ) : searchContent.achievementQueryValue ? (
                  <p className='text-sm text-dynamic font-bold'>{searchContent.achievementQueryValue}</p>
                ) : searchContent.statisticQueryValue ? (
                  <p className='text-sm text-dynamic font-bold'>{searchContent.statisticQueryValue}</p>
                ) : (
                  <p className='text-sm font-bold'>{t('common.search')}</p>
                )}
              </div>
            )}
          </Button>
        </div>

        <div className='flex flex-col gap-1.5 p-2 w-full min-w-0 overflow-hidden'>
          <Divider className='w-full bg-border/60 my-0.5' />
          {mainSidebarItems.map(renderSidebarItem)}
        </div>

        <div className='flex flex-col grow justify-end items-center gap-1.5 p-2 min-w-0 overflow-hidden'>
          {process.env.NODE_ENV === 'production' && <AdSlot />}

          <Divider className='w-full bg-border/60 my-0.5' />

          <div className='flex w-full'>
            <div
              className={cn(
                'p-1.5 rounded-md duration-150 transition-all w-full overflow-hidden',
                activePage === 'settings' ? 'bg-item-active text-content' : 'text-altwhite hover:bg-item-hover',
                isCardFarming || isAchievementUnlocker
                  ? 'opacity-40 hover:bg-transparent hover:shadow-none'
                  : 'cursor-pointer active:scale-95',
              )}
              onClick={
                !(isCardFarming || isAchievementUnlocker)
                  ? () => {
                      setShowAchievements(false)
                      setActivePage('settings')
                    }
                  : undefined
              }
            >
              <div
                className={cn(
                  'flex items-center transition-all duration-500 ease-in-out',
                  sidebarCollapsed ? 'justify-center' : 'gap-3',
                )}
              >
                <div className='shrink-0'>
                  <TbSettings fontSize={20} />
                </div>
                {!sidebarCollapsed && (
                  <div className={cn('transition-all  ease-in-out overflow-hidden whitespace-nowrap')}>
                    <p className='text-sm font-bold'>{t('settings.title')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='flex w-full'>
            <div
              className={cn(
                'p-1.5 rounded-md duration-150 transition-all group w-full overflow-hidden',
                isCardFarming || isAchievementUnlocker
                  ? 'opacity-40'
                  : 'hover:bg-danger/20 cursor-pointer active:scale-95 hover:shadow-sm',
              )}
              onClick={!(isCardFarming || isAchievementUnlocker) ? openConfirmation : undefined}
            >
              <div
                className={cn(
                  'flex items-center min-h-5 transition-all duration-500',
                  sidebarCollapsed ? 'justify-center' : 'gap-3',
                )}
              >
                <div className='shrink-0'>
                  <FiLogOut
                    className={cn(
                      'rotate-180 transition-all duration-150 text-altwhite',
                      isCardFarming || isAchievementUnlocker ? '' : 'group-hover:text-danger',
                    )}
                    fontSize={18}
                  />
                </div>
                {!sidebarCollapsed && (
                  <div className={cn('transition-all duration-150 overflow-hidden whitespace-nowrap')}>
                    <p className='text-sm text-altwhite font-bold group-hover:text-danger transition-all duration-150'>
                      {t('common.signOut')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SearchBar isModalOpen={showSearchModal} onModalClose={() => setShowSearchModal(false)} />

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
                setShowAchievements(false)
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
