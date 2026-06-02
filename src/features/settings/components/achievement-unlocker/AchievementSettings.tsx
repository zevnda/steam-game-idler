import { useTranslation } from 'react-i18next'
import { FaMinus, FaPlus } from 'react-icons/fa6'
import { Button, cn, Divider, Select, SelectItem, Slider, TimeInput } from '@heroui/react'
import { useAchievementSettings } from '@/features/settings/hooks/achievement-unlocker/useAchievementSettings'
import {
  handleIntervalChange,
  handleNextTaskChange,
  handleScheduleChange,
} from '@/features/settings/services/generalService'
import { SettingsSwitch } from '@/shared/components/SettingsSwitch'
import { useUserStore } from '@/shared/stores'

export function AchievementSettings() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const { sliderLabel, setSliderLabel } = useAchievementSettings()

  const taskOptions = [
    { key: 'cardFarming', label: t('common.cardFarming') },
    { key: 'autoIdle', label: t('customLists.autoIdle.title') },
  ]

  return (
    <div className='relative flex flex-col gap-4 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none mb-3'>
        <p className='text-[10px] uppercase tracking-widest text-altwhite/40 font-black mb-1'>
          {t('settings.title')}
        </p>
        <p className='text-2xl font-black'>{t('common.achievementUnlocker')}</p>
      </div>
      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.achievementUnlocker.idle')}
            </p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.achievementUnlocker.idle.description')}
            </p>
          </div>
          <SettingsSwitch type='achievementUnlocker' name='idle' />
        </div>
        <Divider className='bg-border/15 my-5' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.achievementUnlocker.hidden')}
            </p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.achievementUnlocker.hidden.description')}
            </p>
          </div>
          <SettingsSwitch type='achievementUnlocker' name='hidden' />
        </div>
        <Divider className='bg-border/15 my-5' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('common.nextTask')}</p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.achievementUnlocker.nextTask.description')}
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <Select
              aria-label='nextTask'
              disallowEmptySelection
              radius='none'
              items={taskOptions}
              className='w-50'
              placeholder={t('common.nextTask.selectPlaceholder')}
              classNames={{
                listbox: ['p-0'],
                value: ['text-sm !text-content'],
                trigger: cn(
                  'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-lg',
                ),
                popoverContent: ['bg-input rounded-xl justify-start !text-content'],
              }}
              isDisabled={!userSettings.achievementUnlocker.nextTaskCheckbox}
              defaultSelectedKeys={
                userSettings.achievementUnlocker.nextTask
                  ? [userSettings.achievementUnlocker.nextTask]
                  : []
              }
              onSelectionChange={e =>
                handleNextTaskChange(
                  'achievementUnlocker',
                  e.currentKey!,
                  userSummary,
                  setUserSettings,
                )
              }
            >
              {item => (
                <SelectItem
                  classNames={{
                    base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
                  }}
                >
                  {item.label}
                </SelectItem>
              )}
            </Select>
            <SettingsSwitch type='achievementUnlocker' name='nextTaskCheckbox' />
          </div>
        </div>
        <Divider className='bg-border/15 my-5' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.achievementUnlocker.scheduleLabel')}
            </p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.achievementUnlocker.schedule.description')}
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <TimeInput
              aria-label='schedule-from'
              isDisabled={!userSettings?.achievementUnlocker?.schedule}
              value={userSettings?.achievementUnlocker?.scheduleFrom}
              size='sm'
              className='w-23.75'
              classNames={{
                inputWrapper: cn(
                  'rounded-lg min-h-[25px] max-h-[25px] bg-input hover:bg-inputhover border border-border focus-within:!bg-inputhover',
                ),
                segment: ['!text-content'],
                input: ['text-sm'],
              }}
              onChange={value =>
                handleScheduleChange(value, 'scheduleFrom', userSummary, setUserSettings)
              }
            />
            <p className='text-sm'>{t('settings.achievementUnlocker.scheduleTo')}</p>
            <TimeInput
              aria-label='schedule-to'
              isDisabled={!userSettings?.achievementUnlocker?.schedule}
              value={userSettings?.achievementUnlocker?.scheduleTo}
              size='sm'
              className='w-23.75'
              classNames={{
                inputWrapper: cn(
                  'rounded-lg min-h-[25px] max-h-[25px] bg-input hover:bg-inputhover border border-border focus-within:!bg-inputhover',
                ),
                segment: ['!text-content'],
                input: ['text-sm'],
              }}
              onChange={value =>
                handleScheduleChange(value, 'scheduleTo', userSummary, setUserSettings)
              }
            />
            <SettingsSwitch type='achievementUnlocker' name='schedule' />
          </div>
        </div>
        <Divider className='bg-border/15 my-5' />
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.achievementUnlocker.unlockInterval')}
            </p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>{sliderLabel}</p>
          </div>
          <div className='flex flex-col items-center gap-1'>
            <Slider
              size='md'
              step={1}
              minValue={1}
              maxValue={2880}
              defaultValue={userSettings?.achievementUnlocker?.interval}
              hideValue
              className='mt-2 w-87.5'
              classNames={{
                track: 'bg-input',
                filler: 'bg-dynamic',
                thumb: 'bg-white after:bg-dynamic',
              }}
              onChangeEnd={e => handleIntervalChange(e, userSummary, setUserSettings)}
              onChange={e => {
                if (Array.isArray(e))
                  setSliderLabel(
                    t('settings.achievementUnlocker.interval', { min: e[0], max: e[1] }),
                  )
              }}
            />
            <div className='flex w-full justify-between'>
              <div>
                <Button
                  isIconOnly
                  size='sm'
                  radius='full'
                  variant='light'
                  startContent={<FaMinus />}
                  onPress={() => {
                    const [min, max] = userSettings?.achievementUnlocker?.interval
                    handleIntervalChange([Math.max(1, min - 1), max], userSummary, setUserSettings)
                  }}
                />
                <Button
                  isIconOnly
                  size='sm'
                  radius='full'
                  variant='light'
                  startContent={<FaPlus />}
                  onPress={() => {
                    const [min, max] = userSettings?.achievementUnlocker?.interval
                    handleIntervalChange(
                      [Math.min(max, min + 1), max],
                      userSummary,
                      setUserSettings,
                    )
                  }}
                />
              </div>
              <div>
                <Button
                  isIconOnly
                  size='sm'
                  radius='full'
                  variant='light'
                  startContent={<FaMinus />}
                  onPress={() => {
                    const [min, max] = userSettings?.achievementUnlocker?.interval
                    handleIntervalChange(
                      [min, Math.max(min, max - 1)],
                      userSummary,
                      setUserSettings,
                    )
                  }}
                />
                <Button
                  isIconOnly
                  size='sm'
                  radius='full'
                  variant='light'
                  startContent={<FaPlus />}
                  onPress={() => {
                    const [min, max] = userSettings?.achievementUnlocker?.interval
                    handleIntervalChange(
                      [min, Math.min(2880, max + 1)],
                      userSummary,
                      setUserSettings,
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
