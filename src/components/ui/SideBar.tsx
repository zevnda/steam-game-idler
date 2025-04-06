import type { ReactElement } from 'react'

import { Button, cn, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { FiLogOut } from 'react-icons/fi'
import {
  TbAward,
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
import CustomTooltip from '@/components/ui/CustomTooltip'
import useSideBar from '@/hooks/ui/useSideBar'

export default function SideBar(): ReactElement {
  const { t } = useTranslation()
  const { idleGamesList } = useIdleContext()
  const { isDarkMode, showFreeGamesTab, isCardFarming, isAchievementUnlocker } = useStateContext()
  const { activePage, setActivePage } = useNavigationContext()
  const { isOpen, onOpenChange, openConfirmation, handleLogout } = useSideBar(activePage, setActivePage)

  return (
    <>
      <div className='flex justify-between flex-col w-14 min-h-calc max-h-calc bg-titlebar'>
        <div className='flex justify-center items-center flex-col gap-2'>
          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('gamesList.title')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                  activePage === 'games' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover',
                )}
                onClick={() => setActivePage('games')}
              >
                <TbDeviceGamepad2 fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('idlingGames.title')} placement='right'>
              <div
                className={`
                                p-2 rounded-full duration-200 cursor-pointer active:scale-90 
                                ${idleGamesList.length > 0 && 'text-dynamic animate-pulse'}
                                ${activePage === 'idling' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover'}
                                `}
                onClick={() => setActivePage('idling')}
              >
                <TbPlayerPlay fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('common.cardFarming')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                  isCardFarming && 'text-dynamic animate-pulse',
                  activePage === 'customlists/card-farming' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover',
                )}
                onClick={() => setActivePage('customlists/card-farming')}
              >
                <TbCards fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('common.achievementUnlocker')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                  isAchievementUnlocker && 'text-dynamic animate-pulse',
                  activePage === 'customlists/achievement-unlocker'
                    ? 'bg-dynamic/30 text-dynamic'
                    : 'hover:bg-titlehover',
                )}
                onClick={() => setActivePage('customlists/achievement-unlocker')}
              >
                <TbAward fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('customLists.autoIdle.title')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                  activePage === 'customlists/auto-idle' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover',
                )}
                onClick={() => setActivePage('customlists/auto-idle')}
              >
                <TbHourglassLow fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          <div className='flex justify-center items-center w-14'>
            <CustomTooltip content={t('customLists.favorites.title')} placement='right'>
              <div
                className={cn(
                  'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                  activePage === 'customlists/favorites' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover',
                )}
                onClick={() => setActivePage('customlists/favorites')}
              >
                <TbHeart fontSize={22} />
              </div>
            </CustomTooltip>
          </div>

          {showFreeGamesTab && (
            <div className='flex justify-center items-center w-14'>
              <CustomTooltip content={t('freeGames.title')} placement='right'>
                <div
                  className={cn(
                    'relative flex justify-center items-center p-2 rounded-full',
                    'duration-200 cursor-pointer active:scale-90',
                    activePage === 'freeGames' ? 'bg-yellow-400/20' : 'hover:bg-titlehover',
                  )}
                  onClick={() => setActivePage('freeGames')}
                >
                  <TbGift className='text-[#ffc700]' fontSize={22} />
                </div>
              </CustomTooltip>
            </div>
          )}
        </div>

        {!isCardFarming && !isAchievementUnlocker && (
          <div className='flex justify-center items-center flex-col gap-2 mb-3'>
            <div className='flex justify-center items-center w-14'>
              <CustomTooltip content={t('settings.title')} placement='right'>
                <div
                  className={cn(
                    'p-2 rounded-full duration-200 cursor-pointer active:scale-90',
                    activePage === 'settings' ? 'bg-dynamic/30 text-dynamic' : 'hover:bg-titlehover',
                  )}
                  onClick={() => setActivePage('settings')}
                >
                  <TbSettings fontSize={22} />
                </div>
              </CustomTooltip>
            </div>

            <div className='flex justify-center items-center w-14'>
              <CustomTooltip content={t('common.signOut')} placement='right'>
                <div
                  className='hover:bg-danger p-2 rounded-full duration-200 cursor-pointer active:scale-90 group'
                  onClick={openConfirmation}
                >
                  <FiLogOut
                    className={`rotate-180 ${!isDarkMode && 'group-hover:text-button-text'} duration-200`}
                    fontSize={20}
                  />
                </div>
              </CustomTooltip>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className='bg-modalbody text-content'
        classNames={{
          closeButton: ['text-altwhite hover:bg-titlehover duration-200'],
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                {t('common.confirm')}
              </ModalHeader>
              <ModalBody className='my-4'>
                <p className='text-sm'>{t('confirmation.logout')}</p>
              </ModalBody>
              <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                <Button size='sm' color='danger' variant='light' className='font-semibold rounded-lg' onPress={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  size='sm'
                  className='font-semibold rounded-lg bg-dynamic text-button-text'
                  onPress={() => handleLogout(onClose)}
                >
                  {t('common.confirm')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
