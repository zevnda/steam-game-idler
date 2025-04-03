import { Checkbox } from '@heroui/react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';

import { useStateContext } from '@/components/contexts/StateContext';
import { useUserContext } from '@/components/contexts/UserContext';
import { useAchievementSettings } from '@/hooks/settings/useAchievementSettings';
import { useCardSettings } from '@/hooks/settings/useCardSettings';
import { useGeneralSettings, handleRunAtStartupChange } from '@/hooks/settings/useGeneralSettings';
import { handleCheckboxChange } from '@/hooks/settings/useSettings';
import type { AchievementUnlockerSettings, CardFarmingSettings, GeneralSettings } from '@/types';
import { antiAwayStatus } from '@/utils/tasks';

interface SettingsCheckboxProps {
    type: 'general' | 'cardFarming' | 'achievementUnlocker';
    name: string;
    content: string;
}

export default function SettingsCheckbox({ type, name, content }: SettingsCheckboxProps): ReactElement {
    const { isDarkMode } = useStateContext();
    const { userSummary, userSettings, setUserSettings } = useUserContext();
    const [styles, setStyles] = useState({});
    const { startupState, setStartupState } = useGeneralSettings();

    useCardSettings();
    useAchievementSettings();

    useEffect(() => {
        setStyles(isDarkMode ? 'group-data-[hover=true]:before:bg-white/20' : 'group-data-[hover=true]:before:bg-black/20');
    }, [isDarkMode]);

    const isSettingEnabled = (): boolean => {
        if (!userSettings) return false;

        if (type === 'general') {
            return Boolean((userSettings.general as GeneralSettings)[name as keyof GeneralSettings]);
        }
        if (type === 'cardFarming') {
            return Boolean((userSettings.cardFarming as CardFarmingSettings)[name as keyof CardFarmingSettings]);
        }
        if (type === 'achievementUnlocker') {
            return Boolean((userSettings.achievementUnlocker as AchievementUnlockerSettings)[name as keyof AchievementUnlockerSettings]);
        }
        return false;
    };

    if (name === 'antiAway') {
        return (
            <Checkbox
                name={name}
                isSelected={isSettingEnabled()}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    handleCheckboxChange(e, 'general', userSummary?.steamId, setUserSettings);
                    antiAwayStatus(isSettingEnabled() ? null : undefined);
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
            isSelected={isSettingEnabled()}
            onChange={(e) => {
                if (type === 'general') {
                    handleCheckboxChange(e, 'general', userSummary?.steamId, setUserSettings);
                } else if (type === 'cardFarming') {
                    handleCheckboxChange(e, 'cardFarming', userSummary?.steamId, setUserSettings);
                } else {
                    handleCheckboxChange(e, 'achievementUnlocker', userSummary?.steamId, setUserSettings);
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