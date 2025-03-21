import { Checkbox } from '@heroui/react';
import { useContext, useEffect, useState } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { useAchievementSettings, achievementCheckboxChange } from '@/hooks/settings/useAchievementSettings';
import { useCardSettings, cardCheckboxChange } from '@/hooks/settings/useCardSettings';
import { useGeneralSettings, generalCheckboxChange, handleRunAtStartupChange } from '@/hooks/settings/useGeneralSettings';
import { antiAwayStatus } from '@/utils/global/tasks';

export default function SettingsCheckbox({ type, name, content, settings, setSettings, localSettings, setLocalSettings }) {
    const { isDarkMode } = useContext(StateContext);
    const [styles, setStyles] = useState({});

    const { startupState, setStartupState } = useGeneralSettings(settings, setLocalSettings);
    useCardSettings(settings, setLocalSettings);
    useAchievementSettings(settings, setLocalSettings);

    useEffect(() => {
        setStyles(isDarkMode ? 'group-data-[hover=true]:before:bg-white/20' : 'group-data-[hover=true]:before:bg-black/20');
    }, [isDarkMode]);

    if (name === 'antiAway') {
        return (
            <Checkbox
                name={name}
                isSelected={localSettings?.[type]?.[name] || false}
                onChange={(e) => {
                    generalCheckboxChange(e, localSettings, setLocalSettings, setSettings);
                    antiAwayStatus(!localSettings?.[type]?.[name]);
                }}
                classNames={{
                    wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button ${styles}`]
                }}
            >
                <div className='flex items-center gap-1'>
                    <p className='text-xs text-content'>
                        {content}
                    </p>
                </div>
            </Checkbox>
        );
    }

    if (name === 'runAtStartup') {
        return (
            <Checkbox
                name={name}
                isSelected={startupState || false}
                onChange={() => handleRunAtStartupChange(setStartupState)}
                classNames={{
                    wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button ${styles}`]
                }}
            >
                <div className='flex items-center gap-1'>
                    <p className='text-xs text-content'>
                        {content}
                    </p>
                </div>
            </Checkbox>
        );
    }

    return (
        <Checkbox
            name={name}
            isSelected={localSettings?.[type]?.[name] || false}
            onChange={(e) => {
                if (type === 'general') {
                    generalCheckboxChange(e, localSettings, setLocalSettings, setSettings);
                } else if (type === 'cardFarming') {
                    cardCheckboxChange(e, localSettings, setLocalSettings, setSettings);
                } else {
                    achievementCheckboxChange(e, localSettings, setLocalSettings, setSettings);
                }
            }}
            classNames={{
                wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button ${styles}`]
            }}
        >
            <div className='flex items-center gap-1'>
                <p className='text-xs text-content'>
                    {content}
                </p>
            </div>
        </Checkbox>
    );
}