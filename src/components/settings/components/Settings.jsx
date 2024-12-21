import React, { useEffect, useState } from 'react';
import { Tab, Tabs } from '@nextui-org/react';
import GeneralSettings from './GeneralSettings';
import CardSettings from './CardSettings';
import AchievementSettings from './AchievementSettings';
import Logs from './Logs';
import SettingsMenu from './SettingsMenu';
import ResetSettings from './ResetSettings';
import { getAppVersion, getDefaultSettings, getUpdatedSettings } from '@/src/components/settings/utils/settingsHandler';
import { toast } from 'react-toastify';

export default function Settings({ setInitUpdate, setUpdateManifest }) {
    const [settings, setSettings] = useState(null);
    const [version, setVersion] = useState('v0.0.0');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        getAppVersion(setVersion, toast);
    }, []);

    useEffect(() => {
        const defaultSettings = getDefaultSettings();
        const currentSettings = JSON.parse(localStorage.getItem('settings')) || {};
        const updatedSettings = getUpdatedSettings(defaultSettings, currentSettings);

        if (JSON.stringify(currentSettings) !== JSON.stringify(updatedSettings)) {
            localStorage.setItem('settings', JSON.stringify(updatedSettings));
        }
        setSettings(updatedSettings);
    }, [refreshKey]);

    return (
        <React.Fragment key={refreshKey}>
            <div className='w-calc min-h-calc max-h-calc overflow-y-auto'>
                <div className='p-4 pt-2'>
                    <div className='flex justify-between items-center'>
                        <div className='flex flex-col'>
                            <p className='text-lg font-semibold'>
                                Settings
                            </p>
                            <p className='text-xs text-gray-400'>
                                v{version}
                            </p>
                        </div>

                        <div className='flex items-center gap-2'>
                            <ResetSettings setSettings={setSettings} setRefreshKey={setRefreshKey} />

                            <SettingsMenu setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                        </div>
                    </div>

                    <Tabs
                        size='sm'
                        aria-label='Settings tabs'
                        color='default'
                        variant='solid'
                        className='mt-6'
                        classNames={{
                            base: 'bg-titlebar rounded-t p-0 border-t border-l border-r border-border',
                            tabList: 'gap-0 w-full bg-transparent',
                            tab: 'px-6 py-3 rounded-none bg-transparent px-4 data-[hover-unselected=true]:bg-gray-500 data-[hover-unselected=true]:bg-opacity-5 data-[hover-unselected=true]:opacity-100',
                            tabContent: 'text-sm',
                            cursor: 'bg-base w-full rounded',
                            panel: 'bg-titlebar rounded rounded-tl-none border border-border',
                        }}
                    >
                        <Tab key='general' title='General'>
                            <GeneralSettings settings={settings} setSettings={setSettings} />
                        </Tab>
                        <Tab key='card-farming' title='Card Farming'>
                            <CardSettings settings={settings} setSettings={setSettings} />
                        </Tab>
                        <Tab key='achievement-unlocker' title='Achievement Unlocker'>
                            <AchievementSettings settings={settings} setSettings={setSettings} />
                        </Tab>
                        <Tab key='logs' title='Logs'>
                            <Logs />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </React.Fragment >
    );
}