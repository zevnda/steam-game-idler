import { cn, Slider, TimeInput } from '@heroui/react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserContext } from '@/components/contexts/UserContext';
import SettingsCheckbox from '@/components/settings/SettingsCheckbox';
import { useAchievementSettings, handleSliderChange, handleScheduleChange } from '@/hooks/settings/useAchievementSettings';

export default function AchievementSettings(): ReactElement {
    const { t } = useTranslation();
    const { userSummary, userSettings, setUserSettings } = useUserContext();
    const { sliderLabel, setSliderLabel } = useAchievementSettings();

    return (
        <div className='flex flex-col gap-4 p-2'>
            <div className='flex flex-col gap-4'>

                <SettingsCheckbox
                    type='achievementUnlocker'
                    name='idle'
                    content={t('settings.achievementUnlocker.idle')}
                />

                <SettingsCheckbox
                    type='achievementUnlocker'
                    name='hidden'
                    content={t('settings.achievementUnlocker.hidden')}
                />

                <div className='flex items-center gap-2'>
                    <SettingsCheckbox
                        type='achievementUnlocker'
                        name='schedule'
                        content={t('settings.achievementUnlocker.scheduleLabel')}
                    />

                    <TimeInput
                        aria-label='schedule-from'
                        isDisabled={!userSettings?.achievementUnlocker?.schedule}
                        value={userSettings?.achievementUnlocker?.scheduleFrom}
                        size='sm'
                        className='w-[80px]'
                        classNames={{
                            inputWrapper: cn(
                                'rounded-lg min-h-[25px] max-h-[25px] bg-input',
                                'hover:bg-inputhover border border-header-border'
                            ),
                            segment: ['!text-content'],
                            input: ['text-xs'],
                        }}
                        onChange={(value) => handleScheduleChange(value, 'scheduleFrom', userSummary, setUserSettings)}
                    />

                    <p className='text-xs'>
                        {t('settings.achievementUnlocker.scheduleAnd')}
                    </p>

                    <TimeInput
                        aria-label='schedule-to'
                        isDisabled={!userSettings?.achievementUnlocker?.schedule}
                        value={userSettings?.achievementUnlocker?.scheduleTo}
                        size='sm'
                        className='w-[80px]'
                        classNames={{
                            inputWrapper: cn(
                                'rounded-lg min-h-[25px] max-h-[25px] bg-input',
                                'hover:bg-inputhover border border-header-border'
                            ),
                            segment: ['!text-content'],
                            input: ['text-xs'],
                        }}
                        onChange={(value) => handleScheduleChange(value, 'scheduleTo', userSummary, setUserSettings)}
                    />
                </div>

                <Slider
                    label={
                        <p className='text-xs'>
                            {sliderLabel}
                        </p>
                    }
                    size='sm'
                    step={5}
                    minValue={5}
                    maxValue={720}
                    defaultValue={userSettings?.achievementUnlocker?.interval}
                    formatOptions={{ style: 'currency', currency: 'USD' }}
                    hideValue
                    className='w-[500px] mt-2'
                    classNames={{ value: ['text-xs'] }}
                    onChangeEnd={(e) => handleSliderChange(e, userSummary, setUserSettings)}
                    onChange={(e) => {
                        if (Array.isArray(e)) {
                            setSliderLabel(t('settings.achievementUnlocker.interval', { min: e[0], max: e[1] }));
                        }
                    }}
                />
            </div>
        </div>
    );
}