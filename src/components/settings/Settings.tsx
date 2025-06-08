import type { CurrentSettingsTabType } from '@/types'
import type { Key, ReactElement } from 'react'

import { cn, Tab, Tabs } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import AchievementSettings from '@/components/settings/AchievementSettings'
import CardSettings from '@/components/settings/CardSettings'
import ClearData from '@/components/settings/ClearData'
import ExportSettings from '@/components/settings/ExportSettings'
import GeneralSettings from '@/components/settings/GeneralSettings'
import Logs from '@/components/settings/Logs'
import OpenSettings from '@/components/settings/OpenSettings'
import ResetSettings from '@/components/settings/ResetSettings'
import useSettings from '@/hooks/settings/useSettings'

export default function Settings(): ReactElement {
  const { t } = useTranslation()
  const { version, refreshKey, setRefreshKey } = useSettings()
  const { setCurrentSettingsTab } = useNavigationContext()

  return (
    <div
      key={refreshKey}
      className={cn(
        'w-calc min-h-calc max-h-calc bg-base overflow-y-auto',
        'rounded-tl-xl border-t border-l border-border',
      )}
    >
      <div
        className={cn(
          'fixed flex justify-between items-center w-[calc(100svw-80px)]',
          'py-2 pl-4 bg-base bg-opacity-90 backdrop-blur-md z-10 rounded-tl-xl',
        )}
      >
        <div className='flex flex-col'>
          <p className='text-lg font-bold select-none'>{t('settings.title')}</p>
          <p className='text-sm text-dynamic'>v{version}</p>
        </div>

        <div className='flex items-center gap-2'>
          <OpenSettings />
          <ExportSettings />
          <ResetSettings setRefreshKey={setRefreshKey} />
          <ClearData />
        </div>
      </div>

      <div className='p-4 pt-2 mt-[60px]'>
        <Tabs
          isVertical
          size='sm'
          aria-label='Settings tabs'
          color='default'
          variant='solid'
          onSelectionChange={(key: Key) => setCurrentSettingsTab(key as CurrentSettingsTabType)}
          classNames={{
            base: 'fixed bg-titlebar rounded-lg p-0 border border-border',
            tabList: 'gap-0 w-full bg-transparent w-[182px]',
            tab: cn(
              'data-[hover-unselected=true]:!bg-tab-hover',
              'data-[hover-unselected=true]:opacity-100',
              'rounded-lg bg-transparent justify-start',
            ),
            tabContent: 'text-sm group-data-[selected=true]:text-content text-altwhite truncate',
            cursor: '!bg-tab-select w-full',
            panel: 'w-full ml-[184px] mr-0 pr-0',
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
          <Tab key='logs' title={t('settings.logs.title')}>
            <Logs />
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}
