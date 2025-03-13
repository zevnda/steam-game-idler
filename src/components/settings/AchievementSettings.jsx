import { Fragment } from 'react';

import { Checkbox, Slider, TimeInput } from '@heroui/react';

import { handleCheckboxChange, handleSliderChange, handleScheduleChange, updateLabel } from '@/utils/settings/achievementSettingsHandler';
import useAchievementSettings from '@/hooks/settings/useAchievementSettings';

export default function AchievementSettings({ settings, setSettings }) {
    const { labelInterval, localSettings, setLocalSettings, setLabelInterval } = useAchievementSettings(settings);

    return (
        <Fragment>
            {localSettings && localSettings.achievementUnlocker && (
                <div className='flex flex-col gap-4 p-2'>
                    <div className='flex flex-col gap-4'>
                        <Checkbox
                            name='idle'
                            isSelected={localSettings?.achievementUnlocker?.idle || false}
                            onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                            classNames={{
                                wrapper: ['before:group-data-[selected=true]:!border-dynamic after:bg-dynamic text-button'],
                            }}
                        >
                            <div className='flex items-center gap-1'>
                                <p className='text-xs text-content'>
                                    Idle games while Achievement Unlocker is active
                                </p>
                            </div>
                        </Checkbox>

                        <Checkbox
                            name='hidden'
                            isSelected={localSettings?.achievementUnlocker?.hidden || false}
                            onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                            classNames={{
                                wrapper: ['before:group-data-[selected=true]:!border-dynamic after:bg-dynamic text-button']
                            }}
                        >
                            <div className='flex items-center gap-1'>
                                <p className='text-xs text-content'>
                                    Skip hidden achievements
                                </p>
                            </div>
                        </Checkbox>

                        <div className='flex items-center gap-2'>
                            <Checkbox
                                name='schedule'
                                isSelected={localSettings?.achievementUnlocker?.schedule || false}
                                onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                                classNames={{
                                    wrapper: ['before:group-data-[selected=true]:!border-dynamic after:bg-dynamic text-button']
                                }}
                            >
                                <div className='flex items-center gap-1'>
                                    <p className='text-xs text-content'>
                                        Only unlock achievements between
                                    </p>
                                </div>
                            </Checkbox>
                            <TimeInput
                                aria-label='schedule-from'
                                isDisabled={!localSettings?.achievementUnlocker?.schedule}
                                value={localSettings?.achievementUnlocker?.scheduleFrom}
                                size='sm'
                                className='w-[80px]'
                                classNames={{
                                    inputWrapper: ['rounded-lg min-h-[25px] max-h-[25px]'],
                                    input: ['text-xs'],
                                }}
                                onChange={(value) => handleScheduleChange(value, 'scheduleFrom', localSettings, setLocalSettings, setSettings)}
                            />
                            <p className='text-xs'>
                                and
                            </p>
                            <TimeInput
                                aria-label='schedule-to'
                                isDisabled={!localSettings?.achievementUnlocker?.schedule}
                                value={localSettings?.achievementUnlocker?.scheduleTo}
                                size='sm'
                                className='w-[80px]'
                                classNames={{
                                    inputWrapper: ['rounded-lg min-h-[25px] max-h-[25px]'],
                                    input: ['text-xs'],
                                }}
                                onChange={(value) => handleScheduleChange(value, 'scheduleTo', localSettings, setLocalSettings, setSettings)}
                            />
                        </div>

                        <Slider
                            label={
                                <p className='text-xs'>
                                    Unlock achievements randomly every {labelInterval} minutes
                                </p>
                            }
                            size='sm'
                            step={5}
                            minValue={5}
                            maxValue={720}
                            defaultValue={localSettings?.achievementUnlocker?.interval}
                            formatOptions={{ style: 'currency', currency: 'USD' }}
                            hideValue
                            className='w-[500px] mt-2'
                            classNames={{ value: ['text-xs'] }}
                            onChangeEnd={(e) => handleSliderChange(e, localSettings, setLocalSettings, setSettings)}
                            onChange={(e) => updateLabel(e, setLabelInterval)}
                        />
                    </div>
                </div>
            )}
        </Fragment >
    );
}