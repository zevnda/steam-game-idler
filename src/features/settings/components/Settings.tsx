import type { CurrentSettingsTabType } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'
import { Button, cn, Modal, ModalBody, ModalContent, Tab, Tabs } from '@heroui/react'
import { AchievementSettings } from '@/features/settings/components/achievement-unlocker/AchievementSettings'
import { CardSettings } from '@/features/settings/components/card-farming/CardSettings'
import { CustomizationSettings } from '@/features/settings/components/customization/CustomizationSettings'
import { Logs } from '@/features/settings/components/debug/Logs'
import { FreeGamesSettings } from '@/features/settings/components/free-games/FreeGamesSettings'
import { GameSettings } from '@/features/settings/components/game-settings/GameSettings'
import { GeneralSettings } from '@/features/settings/components/general/GeneralSettings'
import { InventoryManagerSettings } from '@/features/settings/components/inventory-manager/InventoryManagerSettings'
import { KeybindsSettings } from '@/features/settings/components/keybinds/KeybindsSettings'
import { SteamCredentials } from '@/features/settings/components/steam-credentials/SteamCredentials'
import { SubscriptionSettings } from '@/features/settings/components/subscription/SubscriptionSettings'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { SocialButtons } from '@/shared/components/SocialButtons'
import { useUiStore } from '@/shared/stores'

export function Settings() {
  const { t } = useTranslation()
  const { version } = useSettings()
  const activePage = useUiStore(s => s.activePage)
  const setActivePage = useUiStore(s => s.setActivePage)
  const previousActivePage = useUiStore(s => s.previousActivePage)
  const setPreviousActivePage = useUiStore(s => s.setPreviousActivePage)
  const currentSettingsTab = useUiStore(s => s.currentSettingsTab)
  const setCurrentSettingsTab = useUiStore(s => s.setCurrentSettingsTab)

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
        backdrop: 'bg-black/75 z-50',
        base: 'w-[88vw] h-[88vh] max-w-[88vw] max-h-[88vh] bg-surface rounded-3xl border border-border/20 shadow-2xl',
        wrapper: 'overflow-hidden',
      }}
    >
      <ModalContent className='flex flex-col h-full overflow-hidden'>
        <ModalBody className='flex-1 min-h-0 p-0 overflow-hidden'>
          <div className='flex h-full bg-surface'>
            <div className='relative w-56 shrink-0 bg-base border-r border-border/20 flex flex-col'>
              <div className='absolute top-3 left-3 z-40'>
                <Button
                  isIconOnly
                  size='sm'
                  radius='full'
                  className='bg-card border border-border/20 text-altwhite hover:text-content'
                  startContent={<TbX size={14} />}
                  onPress={handleClose}
                />
              </div>
              <div className='flex-1 overflow-y-auto pt-12 pb-4'>
                <Tabs
                  isVertical
                  aria-label='Settings tabs'
                  selectedKey={currentSettingsTab}
                  onSelectionChange={key => setCurrentSettingsTab(key as CurrentSettingsTabType)}
                  classNames={{
                    base: 'w-full',
                    tabList: 'gap-0.5 bg-transparent p-3 w-full',
                    tab: cn(
                      'data-[hover-unselected=true]:opacity-100 rounded-xl bg-transparent justify-start py-2.5 px-3',
                    ),
                    tabContent:
                      'font-semibold text-sm truncate duration-150 text-altwhite/60 group-data-[hover-unselected=true]:text-altwhite group-data-[selected=true]:text-content',
                    cursor: '!bg-card border border-border/20 rounded-xl shadow-none w-full',
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
              <div className='flex flex-col items-center gap-4 px-6 pb-4 border-t border-border/15 pt-4'>
                <SocialButtons />
                <span className='text-xs text-altwhite/50 text-center'>
                  Steam Game Idler v{version}
                </span>
              </div>
            </div>
            <div className='flex-1 overflow-y-auto px-8 pt-7 pb-12'>{renderContent()}</div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
