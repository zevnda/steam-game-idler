import { Fragment, useContext, useEffect, useState } from 'react';

import { Checkbox } from '@heroui/react';

import { useGeneralSettings, generalCheckboxChange, handleRunAtStartupChange } from '@/hooks/settings/useGeneralSettings';
import { useCardSettings, cardCheckboxChange } from '@/hooks/settings/useCardSettings';
import { useAchievementSettings, achievementCheckboxChange } from '@/hooks/settings/useAchievementSettings';
import { StateContext } from '@/components/contexts/StateContext';
import { antiAwayStatus } from '@/utils/utils';

export default function SettingsCheckbox({ type, name, content, settings, setSettings, localSettings, setLocalSettings }) {
    const { isDarkMode } = useContext(StateContext);
    const [styles, setStyles] = useState({});

    const { startupState, setStartupState } = useGeneralSettings(settings, setLocalSettings);
    useCardSettings(settings, setLocalSettings);
    useAchievementSettings(settings, setLocalSettings);

    useEffect(() => {
        setStyles(isDarkMode ? 'group-data-[hover=true]:before:bg-white/20' : 'group-data-[hover=true]:before:bg-black/20');
    }, [isDarkMode]);

    return (
        <Fragment>
            {name === 'antiAway' ? (
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
            ) : name === 'runAtStartup' ? (
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
            ) : (
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
            )}
        </Fragment>
    );
}