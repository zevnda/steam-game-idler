import React from 'react';
import { Checkbox, Slider, Spinner, TimeInput } from '@nextui-org/react';
import { handleCheckboxChange, handleSliderChange, handleScheduleChange, updateLabel } from '@/src/components/settings/utils/achievementSettingsHandler';
import useAchievementSettings from '@/src/components/settings/hooks/useAchievementSettings';

export default function AchievementSettings({ settings, setSettings }) {
    const { labelInterval, localSettings, setLocalSettings, setLabelInterval } = useAchievementSettings(settings);

    if (!localSettings || !localSettings.achievementUnlocker) {
        return <Spinner />;
    }

    return (
        <React.Fragment>
            <div className='flex flex-col gap-6 p-2'>
                <div className='grid grid-cols-2'></div>
                <div className='flex flex-col gap-4'>
                    <div className='flex items-center gap-2'>
                        <Checkbox
                            name='schedule'
                            isSelected={localSettings.achievementUnlocker.schedule}
                            onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                        >
                            <div className='flex items-center gap-1'>
                                <p className='text-xs'>
                                    Between the hours of
                                </p>
                            </div>
                        </Checkbox>
                        <TimeInput
                            aria-label='schedule-from'
                            isDisabled={!localSettings.achievementUnlocker.schedule}
                            value={localSettings.achievementUnlocker.scheduleFrom}
                            size='sm'
                            className='w-[80px]'
                            classNames={{
                                inputWrapper: ['rounded min-h-[25px] max-h-[25px] border border-border'],
                                input: ['text-xs'],
                            }}
                            onChange={(value) => handleScheduleChange(value, 'scheduleFrom', localSettings, setLocalSettings, setSettings)}
                        />
                        <p className='text-xs'>
                            to
                        </p>
                        <TimeInput
                            aria-label='schedule-to'
                            isDisabled={!localSettings.achievementUnlocker.schedule}
                            value={localSettings.achievementUnlocker.scheduleTo}
                            size='sm'
                            className='w-[80px]'
                            classNames={{
                                inputWrapper: ['rounded min-h-[25px] max-h-[25px] border border-border'],
                                input: ['text-xs'],
                            }}
                            onChange={(value) => handleScheduleChange(value, 'scheduleTo', localSettings, setLocalSettings, setSettings)}
                        />
                    </div>

                    <Checkbox
                        name='idle'
                        isSelected={localSettings.achievementUnlocker.idle}
                        onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                    >
                        <div className='flex items-center gap-1'>
                            <p className='text-xs'>
                                Idle games while active
                            </p>
                        </div>
                    </Checkbox>

                    <Checkbox
                        name='hidden'
                        isSelected={localSettings.achievementUnlocker.hidden}
                        onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                    >
                        <div className='flex items-center gap-1'>
                            <p className='text-xs'>
                                Skip hidden achievements
                            </p>
                        </div>
                    </Checkbox>

                    <Slider
                        label={
                            <div className='flex justify-between items-center gap-1 min-w-[500px]'>
                                <p className='text-xs'>
                                    Unlock interval
                                </p>
                                <p className='text-xs'>
                                    between {labelInterval} minutes
                                </p>
                            </div>
                        }
                        size='sm'
                        step={5}
                        minValue={5}
                        maxValue={720}
                        defaultValue={localSettings.achievementUnlocker.interval}
                        formatOptions={{ style: 'currency', currency: 'USD' }}
                        hideValue
                        className='w-[500px]'
                        classNames={{ value: ['text-xs'] }}
                        onChangeEnd={(e) => handleSliderChange(e, localSettings, setLocalSettings, setSettings)}
                        onChange={(e) => updateLabel(e, setLabelInterval)}
                    />
                </div>
            </div>
        </React.Fragment >
    );
}