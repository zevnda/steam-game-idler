import type { CurrentSettingsTabType } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'
import { Button, cn, Modal, ModalBody, ModalContent, Tab, Tabs } from '@heroui/react'
import {
  AchievementSettings,
  CardSettings,
  CustomizationSettings,
  FreeGamesSettings,
  GameSettings,
  GeneralSettings,
  InventoryManagerSettings,
  KeybindsSettings,
  Logs,
  SteamCredentials,
  SubscriptionSettings,
  useSettings,
} from '@/features/settings'
import { SocialButtons } from '@/shared/components'
import { useNavigationStore } from '@/shared/stores'

export const Settings = () => {
  const { t } = useTranslation()
  const { version, refreshKey } = useSettings()
  const activePage = useNavigationStore(state => state.activePage)
  const setActivePage = useNavigationStore(state => state.setActivePage)
  const previousActivePage = useNavigationStore(state => state.previousActivePage)
  const setPreviousActivePage = useNavigationStore(state => state.setPreviousActivePage)
  const currentSettingsTab = useNavigationStore(state => state.currentSettingsTab)
  const setCurrentSettingsTab = useNavigationStore(state => state.setCurrentSettingsTab)

  const handleClose = () => {
    setActivePage(previousActivePage)
    setCurrentSettingsTab('general')
    setPreviousActivePage('games')
  }

  const renderContent = () => {
    switch (currentSettingsTab) {
      case 'subscription':
        return <SubscriptionSettings />
      case 'customization':
        return <CustomizationSettings />
      case 'steam-credentials':
        return <SteamCredentials />
      case 'card-farming':
        return <CardSettings />
      case 'achievement-unlocker':
        return <AchievementSettings />
      case 'inventory-manager':
        return <InventoryManagerSettings />
      case 'free-games':
        return <FreeGamesSettings />
      case 'game-settings':
        return <GameSettings />
      case 'keybinds':
        return <KeybindsSettings />
      case 'debug':
        return <Logs />
      default:
        return <GeneralSettings />
    }
  }

  return (
    <Modal
      isOpen={activePage === 'settings'}
      onOpenChange={open => {
        if (!open) handleClose()
      }}
      hideCloseButton
      classNames={{
        backdrop: 'bg-black/70 z-50',
        base: 'w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] bg-gradient-alt',
        wrapper: 'overflow-hidden',
      }}
    >
      <ModalContent className='flex flex-col h-full overflow-hidden'>
        <ModalBody className='flex-1 min-h-0 p-0 overflow-hidden'>
          <div key={refreshKey} className='flex h-full bg-gradient-alt'>
            <div className='relative w-65 shrink-0 bg-sidebar/50 border-r border-border flex flex-col'>
              <div className='absolute top-3 left-3 z-40'>
                <Button
                  isIconOnly
                  radius='full'
                  className='bg-item-hover text-content'
                  startContent={<TbX />}
                  onPress={handleClose}
                />
              </div>

              <div className='flex-1 overflow-y-auto pt-14 pb-4'>
                <Tabs
                  isVertical
                  aria-label='Settings tabs'
                  selectedKey={currentSettingsTab}
                  onSelectionChange={key => setCurrentSettingsTab(key as CurrentSettingsTabType)}
                  classNames={{
                    base: 'w-full',
                    tabList: 'gap-0 bg-transparent p-4 w-full',
                    tab: cn(
                      'data-[hover-unselected=true]:opacity-100',
                      'rounded-lg bg-transparent justify-start py-5',
                    ),
                    tabContent:
                      'font-bold truncate duration-150 text-altwhite group-data-[hover-unselected=true]:text-content group-data-[selected=true]:text-content',
                    cursor: 'bg-transparent! shadow-none w-full',
                    panel: 'hidden',
                  }}
                >
                  <Tab key='general' title={t('settings.general.title')} />
                  <Tab key='subscription' title={t('settings.subscription.title')} />
                  <Tab key='customization' title={t('settings.customization.title')} />
                  <Tab
                    key='steam-credentials'
                    title={t('settings.cardFarming.steamCredentialsTitle')}
                  />
                  <Tab key='card-farming' title={t('common.cardFarming')} />
                  <Tab key='achievement-unlocker' title={t('common.achievementUnlocker')} />
                  <Tab key='inventory-manager' title={t('tradingCards.title')} />
                  <Tab key='free-games' title={t('freeGames.title')} />
                  <Tab key='game-settings' title={t('common.gameSettings')} />
                  <Tab key='keybinds' title={t('settings.keybinds.title')} />
                  <Tab key='debug' title={t('settings.debug.title')} />
                </Tabs>
              </div>

              <div className='flex flex-col items-center gap-4 px-6 pb-4'>
                <SocialButtons />
                <span className='text-xs text-altwhite text-center'>
                  Steam Game Idler v{version}
                </span>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto pb-10 pl-10 pr-4 pt-11'>{renderContent()}</div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
