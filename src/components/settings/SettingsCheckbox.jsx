import { Checkbox } from '@heroui/react';
import { useContext, useEffect, useState } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { useAchievementSettings } from '@/hooks/settings/useAchievementSettings';
import { useCardSettings } from '@/hooks/settings/useCardSettings';
import { useGeneralSettings, handleRunAtStartupChange } from '@/hooks/settings/useGeneralSettings';
import { handleCheckboxChange } from '@/hooks/settings/useSettings';
import { antiAwayStatus } from '@/utils/tasks';

export default function SettingsCheckbox({ type, name, content }) {
    const { isDarkMode } = useContext(StateContext);
    const { userSummary, userSettings, setUserSettings } = useContext(UserContext);
    const [styles, setStyles] = useState({});

    const { startupState, setStartupState } = useGeneralSettings();
    useCardSettings();
    useAchievementSettings();

    useEffect(() => {
        setStyles(isDarkMode ? 'group-data-[hover=true]:before:bg-white/20' : 'group-data-[hover=true]:before:bg-black/20');
    }, [isDarkMode]);

    if (name === 'antiAway') {
        return (
            <Checkbox
                name={name}
                isSelected={userSettings?.[type]?.[name] || false}
                onChange={(e) => {
                    handleCheckboxChange(e, 'general', userSummary.steamId, setUserSettings);
                    antiAwayStatus(!userSettings?.[type]?.[name]);
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
            isSelected={userSettings?.[type]?.[name] || false}
            onChange={(e) => {
                if (type === 'general') {
                    handleCheckboxChange(e, 'general', userSummary.steamId, setUserSettings);
                } else if (type === 'cardFarming') {
                    handleCheckboxChange(e, 'cardFarming', userSummary.steamId, setUserSettings);
                } else {
                    handleCheckboxChange(e, 'achievementUnlocker', userSummary.steamId, setUserSettings);
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