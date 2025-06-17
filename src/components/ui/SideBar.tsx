import type { SidebarItem } from '@/types/navigation'
import type { ReactElement } from 'react'

import { Button, cn } from '@heroui/react'
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

import { useIdleContext } from '@/components/contexts/IdleContext'
import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
import CustomModal from '@/components/ui/CustomModal'
import CustomTooltip from '@/components/ui/CustomTooltip'
import useSideBar from '@/hooks/ui/useSideBar'

export default function SideBar(): ReactElement {
  const { t } = useTranslation()
  const { idleGamesList } = useIdleContext()
  const { isDarkMode, showFreeGamesTab, isCardFarming, isAchievementUnlocker, useBeta } = useStateContext()
  const { activePage, setActivePage } = useNavigationContext()
  const { isOpen, onOpenChange, openConfirmation, handleLogout } = useSideBar(activePage, setActivePage)

  const mainSidebarItems: SidebarItem[] = [
    {
      id: 'games',
      page: 'games',
      icon: TbDeviceGamepad2,
      tooltipKey: 'gamesList.title',
    },
    {
      id: 'idling',
      page: 'idling',
      icon: TbPlayerPlay,
      tooltipKey: 'idlingGames.title',
      isActive: idleGamesList.length > 0,
      customClassName: idleGamesList.length > 0 ? 'text-dynamic animate-pulse' : '',
    },
    {
      id: 'card-farming',
      page: 'customlists/card-farming',
      icon: TbCards,
      tooltipKey: 'common.cardFarming',
      isActive: isCardFarming,
      customClassName: isCardFarming ? 'text-dynamic animate-pulse' : '',
    },
    {
      id: 'achievement-unlocker',
      page: 'customlists/achievement-unlocker',
      icon: TbAward,
      tooltipKey: 'common.achievementUnlocker',
      isActive: isAchievementUnlocker,
      customClassName: isAchievementUnlocker ? 'text-dynamic animate-pulse' : '',
    },
    {
      id: 'auto-idle',
      page: 'customlists/auto-idle',
      icon: TbHourglassLow,
      tooltipKey: 'customLists.autoIdle.title',
    },
    {
      id: 'favorites',
      page: 'customlists/favorites',
      icon: TbHeart,
      tooltipKey: 'customLists.favorites.title',
    },
    {
      id: 'trading-cards',
      page: 'tradingCards',
      icon: TbBuildingStore,
      tooltipKey: 'tradingCards.title',
      shouldShow: useBeta,
    },
    {
      id: 'free-games',
      page: 'freeGames',
      icon: TbGift,
      tooltipKey: 'freeGames.title',
      shouldShow: showFreeGamesTab,
      customClassName: 'text-[#ffc700]',
    },
  ]

  const renderSidebarItem = (item: SidebarItem): ReactElement | null => {
    if (item.shouldShow === false) return null

    const Icon = item.icon
    const isCurrentPage = activePage === item.page
    const isFreeGames = item.id === 'free-games'

    return (
      <div key={item.id} className='flex justify-center items-center w-12'>
        <CustomTooltip content={t(item.tooltipKey)} placement='right'>
          <div
            className={cn(
              'p-1.5 rounded-md duration-150 cursor-pointer active:scale-95 transition-all border border-transparent',
              isFreeGames && 'relative flex justify-center items-center',
              item.customClassName,
              isCurrentPage
                ? isFreeGames
                  ? 'bg-yellow-400/20 border-yellow-400/30 shadow-sm'
                  : 'bg-dynamic/20 text-dynamic border-dynamic/30 shadow-sm'
                : 'hover:bg-titlehover hover:border-border/50 hover:shadow-sm',
            )}
            onClick={() => setActivePage(item.page)}
          >
            <Icon fontSize={22} className={isFreeGames ? 'text-[#ffc700]' : undefined} />
          </div>
        </CustomTooltip>
      </div>
    )
  }

  return (
    <>
      <div className='flex justify-between flex-col w-14 min-h-calc max-h-calc bg-titlebar border-r border-border/50'>
        <div className='flex justify-center items-center flex-col gap-1.5 py-2'>
          {mainSidebarItems.map(renderSidebarItem)}
        </div>

        <div className='flex justify-center items-center flex-col gap-1.5 pb-2'>
          <div className='flex justify-center items-center w-12'>
            <CustomTooltip content={t('settings.title')} placement='right'>
              <div
                className={cn(
                  'p-1.5 rounded-md duration-150 border border-transparent transition-all',
                  activePage === 'settings'
                    ? 'bg-dynamic/20 text-dynamic border-dynamic/30 shadow-sm'
                    : 'hover:bg-titlehover hover:border-border/50 hover:shadow-sm',
                  isCardFarming || isAchievementUnlocker
                    ? 'opacity-40 hover:bg-transparent hover:border-transparent hover:shadow-none'
                    : 'cursor-pointer active:scale-95',
                )}
                onClick={!(isCardFarming || isAchievementUnlocker) ? () => setActivePage('settings') : undefined}
              >
                <TbSettings fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-12'>
            <CustomTooltip content={t('common.signOut')} placement='right'>
              <div
                className={cn(
                  'p-1.5 rounded-md duration-150 border border-transparent transition-all group',
                  isCardFarming || isAchievementUnlocker
                    ? 'opacity-40'
                    : 'hover:bg-danger/20 hover:border-danger/30 cursor-pointer active:scale-95 hover:shadow-sm',
                )}
                onClick={!(isCardFarming || isAchievementUnlocker) ? openConfirmation : undefined}
              >
                <FiLogOut
                  className={cn(
                    'rotate-180 duration-150',
                    !isDarkMode && 'group-hover:text-danger',
                    isCardFarming || isAchievementUnlocker ? '' : 'group-hover:text-danger',
                  )}
                  fontSize={20}
                />
              </div>
            </CustomTooltip>
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
              className='font-semibold rounded-lg'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              onPress={() => handleLogout(onOpenChange)}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
