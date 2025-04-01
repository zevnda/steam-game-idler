import { Tab, Tabs } from '@heroui/react';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import AchievementSettings from '@/components/settings/AchievementSettings';
import CardSettings from '@/components/settings/CardSettings';
import ClearData from '@/components/settings/ClearData';
import ExportSettings from '@/components/settings/ExportSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import Logs from '@/components/settings/Logs';
import ResetSettings from '@/components/settings/ResetSettings';
import useSettings from '@/hooks/settings/useSettings';

export default function Settings(): JSX.Element {
    const { t } = useTranslation();
    const { version, refreshKey, setRefreshKey } = useSettings();

    return (
        <div key={refreshKey} className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto rounded-tl-xl border-t border-l border-border'>
            <div className='p-4 pt-2'>
                <div className='flex justify-between items-center'>
                    <div className='flex flex-col'>
                        <p className='text-lg font-semibold'>
                            {t('settings.title')}
                        </p>
                        <p className='text-xs text-altwhite'>
                            v{version}
                        </p>
                    </div>

                    <div className='flex items-center gap-2'>
                        <ResetSettings setRefreshKey={setRefreshKey} />
                        <ClearData />
                        <ExportSettings />
                    </div>
                </div>

                <Tabs
                    size='sm'
                    aria-label='Settings tabs'
                    color='default'
                    variant='solid'
                    className='mt-6'
                    classNames={{
                        base: 'bg-titlebar rounded-t-lg p-0 border-t border-l border-r border-border',
                        tabList: 'gap-0 w-full bg-transparent',
                        tab: 'px-6 py-3 rounded-none bg-transparent px-4 data-[hover-unselected=true]:bg-gray-500 data-[hover-unselected=true]:bg-opacity-5 data-[hover-unselected=true]:opacity-100',
                        tabContent: 'text-sm group-data-[selected=true]:text-content text-altwhite',
                        cursor: 'bg-base w-full rounded',
                        panel: 'bg-titlebar rounded-lg rounded-tl-none border border-border',
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
    );
}