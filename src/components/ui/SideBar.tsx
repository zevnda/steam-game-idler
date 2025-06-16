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
      <div key={item.id} className='flex justify-center items-center w-14'>
        <CustomTooltip content={t(item.tooltipKey)} placement='right'>
          <div
            className={cn(
              'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
              isFreeGames && 'relative flex justify-center items-center',
              item.customClassName,
              isCurrentPage ? (isFreeGames ? 'bg-yellow-400/20' : 'bg-dynamic/30 text-dynamic') : 'hover:bg-titlehover',
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
      <div className='flex justify-between flex-col w-14 min-h-calc max-h-calc bg-titlebar'>
        <div className='flex justify-center items-center flex-col gap-2'>{mainSidebarItems.map(renderSidebarItem)}</div>

        <div className='flex justify-center items-center flex-col gap-2 mb-3'>
          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('settings.title')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200',
                  activePage === 'settings' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover',
                  isCardFarming || isAchievementUnlocker
                    ? 'opacity-50 hover:bg-transparent'
                    : 'cursor-pointer active:scale-90',
                )}
                onClick={!(isCardFarming || isAchievementUnlocker) ? () => setActivePage('settings') : undefined}
              >
                <TbSettings fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('common.signOut')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200',
                  isCardFarming || isAchievementUnlocker
                    ? 'opacity-50'
                    : 'hover:bg-danger cursor-pointer active:scale-90 group',
                )}
                onClick={!(isCardFarming || isAchievementUnlocker) ? openConfirmation : undefined}
              >
                <FiLogOut
                  className={`rotate-180 ${!isDarkMode && 'group-hover:text-button-text'} duration-200`}
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
