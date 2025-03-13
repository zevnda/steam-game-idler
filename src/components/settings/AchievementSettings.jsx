import { Slider, TimeInput } from '@heroui/react';

import SettingsCheckbox from '@/components/settings/SettingsCheckbox';
import { useAchievementSettings, handleSliderChange, handleScheduleChange, updateLabel } from '@/hooks/settings/useAchievementSettings';

export default function AchievementSettings({ settings, setSettings, localSettings, setLocalSettings }) {
    const { labelInterval, setLabelInterval } = useAchievementSettings(settings);

    return (
        <div className='flex flex-col gap-4 p-2'>
            <div className='flex flex-col gap-4'>

                <SettingsCheckbox
                    type='achievementUnlocker'
                    name='idle'
                    content='Idle games while Achievement Unlocker is active'
                    settings={settings}
                    setSettings={setSettings}
                    localSettings={localSettings}
                    setLocalSettings={setLocalSettings}
                />

                <SettingsCheckbox
                    type='achievementUnlocker'
                    name='hidden'
                    content='Skip hidden achievements'
                    settings={settings}
                    setSettings={setSettings}
                    localSettings={localSettings}
                    setLocalSettings={setLocalSettings}
                />

                <div className='flex items-center gap-2'>
                    <SettingsCheckbox
                        type='achievementUnlocker'
                        name='schedule'
                        content='Only unlock achievements between'
                        settings={settings}
                        setSettings={setSettings}
                        localSettings={localSettings}
                        setLocalSettings={setLocalSettings}
                    />

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

                    <p className='text-xs'>and</p>

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
                    label={<p className='text-xs'>Unlock achievements randomly every {labelInterval} minutes</p>}
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
    );
}