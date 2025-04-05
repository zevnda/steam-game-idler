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
        <div className='relative flex flex-col gap-4'>
            <div className='flex flex-col gap-4 border border-border rounded-lg p-3 bg-titlebar'>
                <p className='font-bold'>
                    {t('common.options')}
                </p>

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
                        className='w-[95px]'
                        classNames={{
                            inputWrapper: cn(
                                'rounded-lg min-h-[25px] max-h-[25px] bg-input',
                                'hover:bg-inputhover border border-header-border',
                                'focus-within:!bg-inputhover'
                            ),
                            segment: ['!text-content'],
                            input: ['text-sm'],
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
                        className='w-[95px]'
                        classNames={{
                            inputWrapper: cn(
                                'rounded-lg min-h-[25px] max-h-[25px] bg-input',
                                'hover:bg-inputhover border border-header-border',
                                'focus-within:!bg-inputhover'
                            ),
                            segment: ['!text-content'],
                            input: ['text-sm'],
                        }}
                        onChange={(value) => handleScheduleChange(value, 'scheduleTo', userSummary, setUserSettings)}
                    />
                </div>

                <Slider
                    label={
                        <p className='text-sm'>
                            {sliderLabel}
                        </p>
                    }
                    size='md'
                    step={1}
                    minValue={1}
                    maxValue={720}
                    defaultValue={userSettings?.achievementUnlocker?.interval}
                    formatOptions={{ style: 'currency', currency: 'USD' }}
                    hideValue
                    className='w-[500px] mt-2'
                    classNames={{
                        value: 'text-xs',
                    }}
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