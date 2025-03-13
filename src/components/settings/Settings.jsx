import { Tab, Tabs } from '@heroui/react';
import { useEffect, useState } from 'react';

import AchievementSettings from '@/components/settings/AchievementSettings';
import CardSettings from '@/components/settings/CardSettings';
import ClearData from '@/components/settings/ClearData';
import ExportSettings from '@/components/settings/ExportSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import Logs from '@/components/settings/Logs';
import ResetSettings from '@/components/settings/ResetSettings';
import SettingsMenu from '@/components/settings/SettingsMenu';
import { getAppVersion, getDefaultSettings, getUpdatedSettings } from '@/utils/settings/settingsHandler';

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [localSettings, setLocalSettings] = useState(null);
    const [version, setVersion] = useState('v0.0.0');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const getAndSetVersion = async () => {
            const version = await getAppVersion();
            setVersion(version);
        };
        getAndSetVersion();
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

    useEffect(() => {
        const currentSettings = JSON.parse(localStorage.getItem('settings')) || {};
        if (currentSettings) {
            setLocalSettings(currentSettings);
        }
    }, [settings, setLocalSettings]);

    return (
        <div key={refreshKey} className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto rounded-tl-xl border-t border-l border-border'>
            <div className='p-4 pt-2'>
                <div className='flex justify-between items-center'>
                    <div className='flex flex-col'>
                        <p className='text-lg font-semibold'>
                            Settings
                        </p>
                        <p className='text-xs text-altwhite'>
                            v{version}
                        </p>
                    </div>

                    <div className='flex items-center gap-2'>
                        <ResetSettings setSettings={setSettings} setRefreshKey={setRefreshKey} />
                        <ClearData />
                        <ExportSettings />
                        <SettingsMenu />
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
                    <Tab key='general' title='General'>
                        <GeneralSettings
                            settings={settings}
                            setSettings={setSettings}
                            localSettings={localSettings}
                            setLocalSettings={setLocalSettings}
                        />
                    </Tab>
                    <Tab key='card-farming' title='Card Farming'>
                        <CardSettings
                            settings={settings}
                            setSettings={setSettings}
                            localSettings={localSettings}
                            setLocalSettings={setLocalSettings}
                        />
                    </Tab>
                    <Tab key='achievement-unlocker' title='Achievement Unlocker'>
                        <AchievementSettings
                            settings={settings}
                            setSettings={setSettings}
                            localSettings={localSettings}
                            setLocalSettings={setLocalSettings}
                        />
                    </Tab>
                    <Tab key='logs' title='Logs'>
                        <Logs />
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}