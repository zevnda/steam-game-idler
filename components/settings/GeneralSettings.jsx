import React, { useEffect, useState } from 'react';
import { Checkbox } from '@nextui-org/react';
import { logEvent } from '@/utils/utils';

export default function GeneralSettings({ settings, setSettings }) {
    const [localSettings, setLocalSettings] = useState(null);

    useEffect(() => {
        if (settings && settings.general) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        if (localSettings && localSettings.general) {
            const updatedSettings = {
                ...localSettings,
                general: {
                    ...localSettings.general,
                    [name]: checked
                }
            };
            updateSettings(updatedSettings);
            logEvent(`[Settings - General] Changed '${name}' to '${checked}'`);
        }
    };

    const updateSettings = (newSettings) => {
        setLocalSettings(newSettings);
        setSettings(newSettings);
        try {
            localStorage.setItem('settings', JSON.stringify(newSettings));
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    };

    return (
        <React.Fragment>
            <div className='flex flex-col gap-4 p-2'>
                <Checkbox
                    name='disableUpdates'
                    isSelected={localSettings?.general?.disableUpdates}
                    onChange={handleCheckboxChange}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Disable automatic updates
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='clearData'
                    isSelected={localSettings?.general?.clearData}
                    onChange={handleCheckboxChange}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Delete locally saved data on logout
                        </p>
                    </div>
                </Checkbox>
            </div>
        </React.Fragment>
    );
}