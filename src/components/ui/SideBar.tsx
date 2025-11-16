import type { SidebarItem } from '@/types/navigation'
import type { ReactElement } from 'react'

import { Button, cn, Divider } from '@heroui/react'
import { useState } from 'react'
import Image from 'next/image'
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
import { useUserContext } from '@/components/contexts/UserContext'
import AdSlot from '@/components/ui/AdSlot'
import Beta from '@/components/ui/Beta'
import CustomModal from '@/components/ui/CustomModal'
import HeaderTitle from '@/components/ui/header/HeaderTitle'
import SearchBar from '@/components/ui/SearchBar'
import useSideBar from '@/hooks/ui/useSideBar'

export default function SideBar(): ReactElement {
  const { t } = useTranslation()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const { idleGamesList } = useIdleContext()
  const { sidebarCollapsed, isCardFarming, isAchievementUnlocker, setShowAchievements, transitionDuration } =
    useStateContext()
  const { activePage, setActivePage } = useNavigationContext()
  const { freeGamesList, userSummary } = useUserContext()
  const searchContent = useSearchContext()
  const { isOpen, onOpenChange, openConfirmation, handleLogout } = useSideBar(activePage, setActivePage)

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
    },
    {
      id: 'favorites',
      page: 'customlists/favorites',
      title: t('customLists.favorites.title'),
      icon: TbHeart,
    },
    {
      id: 'free-games',
      page: 'freeGames',
      title: t('freeGames.title'),
      icon: TbGift,
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
      id: 'trading-cards',
      page: 'tradingCards',
      title: t('tradingCards.title'),
      icon: TbBuildingStore,
    },
    {
      id: 'chat',
      page: 'chat',
      title: t('chat.title'),
      icon: RiChatSmile2Line,
      isBeta: true,
    },
  ]

  // Section headers and their corresponding first item indices
  const sectionHeaders: { [index: number]: string } = {
    0: t('sidebar.section.games'),
    4: t('sidebar.section.automation'),
    7: t('sidebar.section.misc'),
  }

  // Helper to render section header if needed
  const renderSectionHeader = (index: number): ReactElement | null => {
    const header = sectionHeaders[index]
    if (!header) return null
    if (sidebarCollapsed) {
      return <Divider className='w-full bg-border/60 mt-0.5 mb-2' />
    }
    return (
      <div
        className={cn(
          'px-1.5 py-1 mt-2 text-[10px] font-bold text-content uppercase tracking-wider select-none transition-all ease-in-out whitespace-nowrap truncate',
        )}
      >
        {header}
      </div>
    )
  }

  const renderSidebarItem = (item: SidebarItem, index: number): ReactElement | null => {
    const Icon = item.icon
    const isCurrentPage = activePage === item.page
    const isFreeGames = item.id === 'free-games'
    const hasFreeGames = freeGamesList.length > 0
    const isBeta = item.isBeta
    const isChat = item.id === 'chat'

    return (
      <div className='overflow-hidden' key={item.id}>
        {renderSectionHeader(index)}

        <div className='flex w-full'>
          <div
            className={cn(
              'px-1.5 py-1 rounded-lg duration-150 cursor-pointer active:scale-95 border border-transparent w-full overflow-hidden',
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
                <Icon fontSize={20} className={isFreeGames && hasFreeGames ? 'text-[#ffc700]' : undefined} />
                {isChat && item.hasUnread && (
                  <span
                    className={cn(
                      'absolute flex justify-center items-center w-2 h-2 top-0 right-0 text-white text-[10px] font-bold rounded-full',
                    )}
                  />
                )}
              </div>
              {!sidebarCollapsed && (
                <div className={cn('transition-all duration-500 ease-in-out whitespace-nowrap')}>
                  <p
                    className={cn(
                      'flex justify-center items-center text-sm font-bold',
                      isFreeGames && hasFreeGames ? 'text-[#ffc700]' : undefined,
                    )}
                  >
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
          {mainSidebarItems.map((item, idx) => renderSidebarItem(item, idx))}
        </div>

        {process.env.NODE_ENV === 'production' && (
          <div className='flex flex-col items-center justify-end grow mb-4 overflow-hidden'>
            <AdSlot />
          </div>
        )}

        {/* Settings and signout */}
        <div
          className={cn(
            'flex items-center mt-auto w-full bg-gradient-to-t from-gray-900/5 to-gray-400/5',
            'rounded-t-xl',
            sidebarCollapsed ? 'justify-center flex-col gap-2 p-2 pt-3' : 'justify-start p-4',
          )}
        >
          <Image
            src={userSummary?.avatar || ''}
            alt={userSummary?.personaName || 'User Avatar'}
            width={34}
            height={34}
            className='rounded-full'
          />
          {!sidebarCollapsed && (
            <div className='flex items-center justify-between w-full ml-3 overflow-hidden'>
              <div className='flex flex-col overflow-hidden'>
                <p className='text-sm leading-tight truncate whitespace-nowrap'>{userSummary?.personaName}</p>
                <p className='text-[10px] text-altwhite/70 leading-tight truncate whitespace-nowrap'>
                  {userSummary?.steamId}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <div
                  className='text-altwhite hover:bg-item-hover rounded-full p-1.5 duration-150 cursor-pointer'
                  onClick={() => {
                    setShowAchievements(false)
                    setActivePage('settings')
                  }}
                >
                  <TbSettings fontSize={20} />
                </div>
                <div
                  className='text-altwhite hover:text-danger hover:bg-danger/20 rounded-full p-1.5 duration-150 cursor-pointer'
                  onClick={openConfirmation}
                >
                  <FiLogOut fontSize={18} />
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className='flex flex-col items-center gap-2 mt-2'>
              <div
                className='text-altwhite hover:bg-item-hover rounded-full p-1.5 duration-150 cursor-pointer'
                onClick={() => {
                  setShowAchievements(false)
                  setActivePage('settings')
                }}
              >
                <TbSettings fontSize={20} />
              </div>
              <div
                className='text-altwhite hover:text-danger hover:bg-danger/20 rounded-full p-1.5 duration-150 cursor-pointer'
                onClick={openConfirmation}
              >
                <FiLogOut fontSize={18} />
              </div>
            </div>
          )}
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
