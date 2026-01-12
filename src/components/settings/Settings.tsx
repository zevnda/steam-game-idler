import type { CurrentSettingsTabType } from '@/types'
import type { Key, ReactElement } from 'react'

import { Button, cn, Tab, Tabs } from '@heroui/react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'

import AchievementSettings from '@/components/settings/AchievementSettings'
import CardSettings from '@/components/settings/CardSettings'
import CustomizationSettings from '@/components/settings/CustomizationSettings'
import FreeGamesSettings from '@/components/settings/FreeGamesSettings'
import GameSettings from '@/components/settings/GameSettings'
import GeneralSettings from '@/components/settings/GeneralSettings'
import Logs from '@/components/settings/Logs'
import SocialButtons from '@/components/settings/SocialButtons'
import SteamCredentials from '@/components/settings/SteamCredentials'
import TradingCardManagerSettings from '@/components/settings/TradingCardManagerSettings'
import useSettings from '@/hooks/settings/useSettings'

export default function Settings(): ReactElement {
  const { t } = useTranslation()
  const { version, refreshKey } = useSettings()
  const setActivePage = useNavigationStore(state => state.setActivePage)
  const previousActivePage = useNavigationStore(state => state.previousActivePage)
  const setPreviousActivePage = useNavigationStore(state => state.setPreviousActivePage)
  const currentSettingsTab = useNavigationStore(state => state.currentSettingsTab)
  const setCurrentSettingsTab = useNavigationStore(state => state.setCurrentSettingsTab)

  return (
    <div key={refreshKey} className={cn('min-h-screen min-w-screen bg-gradient-alt')}>
      <div className='absolute top-3 left-3 z-40'>
        <Button
          isIconOnly
          radius='full'
          className='bg-item-hover text-content'
          startContent={<TbX />}
          onPress={() => {
            setActivePage(previousActivePage)
            setCurrentSettingsTab('general')
            setPreviousActivePage('games')
          }}
        />
      </div>

      <div className='absolute flex flex-col items-center gap-4 bottom-4 left-0 px-6 w-[250px] z-40'>
        <SocialButtons />
        <span className='text-xs text-altwhite text-center'>Steam Game Idler v{version}</span>
      </div>

      <Tabs
        isVertical
        aria-label='Settings tabs'
        defaultSelectedKey={currentSettingsTab}
        onSelectionChange={(key: Key) => setCurrentSettingsTab(key as CurrentSettingsTabType)}
        classNames={{
          base: 'absolute top-0 bg-sidebar/50 border-r border-border min-h-screen p-4 py-14 z-39',
          tabList: 'gap-0 w-full bg-transparent w-[218px]',
          tab: cn('data-[hover-unselected=true]:opacity-100', 'rounded-lg bg-transparent justify-start py-5'),
          tabContent:
            'font-bold truncate duration-150 text-altwhite group-data-[hover-unselected=true]:text-content group-data-[selected=true]:text-content',
          cursor: 'bg-transparent! shadow-none w-full',
          panel: 'w-full pb-10 pl-10 ml-[260px] mt-9 h-calc overflow-y-auto z-39',
        }}
      >
        <Tab key='general' title={t('settings.general.title')}>
          <GeneralSettings />
        </Tab>
        <Tab key='customization' title={t('settings.customization.title')}>
          <CustomizationSettings />
        </Tab>
        <Tab key='steam-credentials' title={t('settings.cardFarming.steamCredentialsTitle')}>
          <SteamCredentials />
        </Tab>
        <Tab key='card-farming' title={t('common.cardFarming')}>
          <CardSettings />
        </Tab>
        <Tab key='achievement-unlocker' title={t('common.achievementUnlocker')}>
          <AchievementSettings />
        </Tab>
        <Tab key='trading-card-manager' title={t('tradingCards.title')}>
          <TradingCardManagerSettings />
        </Tab>
        <Tab key='free-games' title={t('freeGames.title')}>
          <FreeGamesSettings />
        </Tab>
        <Tab key='game-settings' title={t('common.gameSettings')}>
          <GameSettings />
        </Tab>
        <Tab key='debug' title={t('settings.debug.title')}>
          <Logs />
        </Tab>
      </Tabs>
    </div>
  )
}
