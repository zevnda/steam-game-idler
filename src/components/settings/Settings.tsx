import type { CurrentSettingsTabType } from '@/types'
import type { Key, ReactElement } from 'react'

import { Button, cn, Tab, Tabs } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import AchievementSettings from '@/components/settings/AchievementSettings'
import CardSettings from '@/components/settings/CardSettings'
import GeneralSettings from '@/components/settings/GeneralSettings'
import Logs from '@/components/settings/Logs'
import TradingCardManagerSettings from '@/components/settings/TradingCardManagerSettings'
import ViewDocumentation from '@/components/settings/ViewDocumentation'
import useSettings from '@/hooks/settings/useSettings'

export default function Settings(): ReactElement {
  const { t } = useTranslation()
  const { version, refreshKey } = useSettings()
  const { setActivePage, setCurrentSettingsTab } = useNavigationContext()

  return (
    <div key={refreshKey} className={cn('min-h-screen min-w-screen bg-base')}>
      <div className='absolute top-3 left-3 z-[40]'>
        <Button
          isIconOnly
          radius='full'
          className='bg-item-hover'
          startContent={<TbX />}
          onPress={() => setActivePage('games')}
        />
      </div>

      <div className='absolute flex flex-col items-center gap-4 bottom-4 left-0 px-6 w-[250px] z-[40]'>
        <ViewDocumentation />
        <span className='text-xs text-altwhite text-center'>Steam Game Idler v{version}</span>
      </div>

      <Tabs
        isVertical
        aria-label='Settings tabs'
        onSelectionChange={(key: Key) => setCurrentSettingsTab(key as CurrentSettingsTabType)}
        classNames={{
          base: 'absolute top-0 bg-sidebar min-h-screen p-4 py-14 z-[39]',
          tabList: 'gap-0 w-full bg-transparent w-[218px]',
          tab: cn('data-[hover-unselected=true]:opacity-100', 'rounded-lg bg-transparent justify-start py-5'),
          tabContent:
            'font-bold truncate duration-150 text-altwhite group-data-[hover-unselected=true]:text-content group-data-[selected=true]:text-content',
          cursor: '!bg-transparent shadow-none w-full',
          panel: 'w-full pb-10 pl-10 ml-[260px] mt-9 h-calc overflow-y-auto',
        }}
      >
        <Tab key='general' title={t('settings.general.title')}>
          <GeneralSettings />
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
        <Tab key='logs' title={t('settings.debug.title')}>
          <Logs />
        </Tab>
      </Tabs>
    </div>
  )
}
