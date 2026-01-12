import type { SidebarItem } from '@/types/navigation'
import type { ReactElement } from 'react'

import { Button, cn, Divider } from '@heroui/react'
import { useState } from 'react'
import { useIdleStore } from '@/stores/idleStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { useSearchStore } from '@/stores/searchStore'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FiLogOut } from 'react-icons/fi'
import { RiSearchLine } from 'react-icons/ri'
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

import Beta from '@/components/ui/Beta'
import CustomModal from '@/components/ui/CustomModal'
import HeaderTitle from '@/components/ui/header/HeaderTitle'
import SearchBar from '@/components/ui/SearchBar'
import useSideBar from '@/hooks/ui/useSideBar'

export default function SideBar(): ReactElement {
  const { t } = useTranslation()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const activePage = useNavigationStore(state => state.activePage)
  const setActivePage = useNavigationStore(state => state.setActivePage)
  const freeGamesList = useUserStore(state => state.freeGamesList)
  const userSummary = useUserStore(state => state.userSummary)
  const searchContent = useSearchStore()
  const idleGamesList = useIdleStore(state => state.idleGamesList)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const setShowAchievements = useStateStore(state => state.setShowAchievements)
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
          'px-4 py-1 mb-0 text-[12px] font-bold text-content uppercase tracking-wider select-none',
          'transition-all ease-in-out whitespace-nowrap truncate',
          header !== 'Games' ? 'mt-4' : 'mt-0',
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

    return (
      <div key={item.id}>
        {renderSectionHeader(index)}

        <div className='flex w-full'>
          {/* Left indicator */}
          {!sidebarCollapsed && (
            <div
              className={cn(
                'mr-2 shrink-0 rounded-r-md transition-transform duration-150',
                'w-1.5 h-7',
                isCurrentPage ? 'bg-dynamic scale-y-100' : 'scale-y-0',
              )}
              aria-hidden
            />
          )}
          <div
            className={cn(
              'px-1.5 py-1.5 rounded-lg duration-150 cursor-pointer active:scale-95 w-full overflow-hidden',
              isCurrentPage
                ? sidebarCollapsed
                  ? 'bg-dynamic/10 text-dynamic'
                  : 'bg-linear-to-r from-dynamic/20 via-dynamic/2 to-dynamic/0 text-dynamic'
                : 'text-altwhite hover:bg-item-hover',
              item.customClassName,
            )}
            onClick={() => {
              setShowAchievements(false)
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
                <Icon fontSize={20} className={isFreeGames && hasFreeGames ? 'text-[#ffc700]' : undefined} />
              </div>
              {!sidebarCollapsed && (
                <div className={cn('transition-all duration-150 ease-in-out whitespace-nowrap')}>
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
          'relative flex flex-col h-screen z-40 bg-sidebar/90 border-r border-border select-none ease-in-out',
          sidebarCollapsed ? 'min-w-14 max-w-14' : 'min-w-62.5 max-w-62.5',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'min-width, max-width',
        }}
      >
        <div className={cn('flex flex-col gap-1.5 p-2 w-full min-w-0', sidebarCollapsed ? 'items-center' : undefined)}>
          <HeaderTitle />

          {/* Search button */}
          <Button
            isIconOnly={sidebarCollapsed}
            radius='full'
            isDisabled={activePage === 'idling' || activePage === 'freeGames' || activePage.includes('customlists')}
            className={cn(
              'text-altwhite active:scale-95 w-full mt-4 duration-150',
              sidebarCollapsed ? 'w-0 justify-center' : 'min-w-40 justify-start',
              searchContent.gameQueryValue ||
                searchContent.tradingCardQueryValue ||
                searchContent.achievementQueryValue ||
                searchContent.statisticQueryValue
                ? 'bg-dynamic/10 hover:bg-dynamic/20'
                : 'bg-item-active hover:bg-item-active/90',
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

        <div
          className={cn(
            'flex flex-col gap-1 p-2 w-full min-w-0 overflow-y-auto',
            !sidebarCollapsed ? 'pl-0' : undefined,
          )}
        >
          {mainSidebarItems.map((item, idx) => renderSidebarItem(item, idx))}
        </div>

        {/* Settings and signout */}
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
                  <p className='text-sm leading-tight truncate whitespace-nowrap'>{userSummary?.personaName}</p>
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
                            setShowAchievements(false)
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
                          setShowAchievements(false)
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
