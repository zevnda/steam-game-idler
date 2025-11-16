import type { ReactElement } from 'react'

import { cn, Divider, Select, SelectItem, Slider, TimeInput } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'

import { useUserContext } from '@/components/contexts/UserContext'
import SettingsSwitch from '@/components/settings/SettingsSwitch'
import {
  handleNextTaskChange,
  handleScheduleChange,
  handleSliderChange,
  useAchievementSettings,
} from '@/hooks/settings/useAchievementSettings'

export default function AchievementSettings(): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const { sliderLabel, setSliderLabel } = useAchievementSettings()

  const taskOptions = [
    {
      key: 'cardFarming',
      label: t('common.cardFarming'),
    },
    {
      key: 'autoIdle',
      label: t('customLists.autoIdle.title'),
    },
  ]

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('common.achievementUnlocker')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.achievementUnlocker.idle')}</p>
            <p className='text-xs text-altwhite'>{t('settings.achievementUnlocker.idle.description')}</p>
          </div>
          <SettingsSwitch type='achievementUnlocker' name='idle' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.achievementUnlocker.hidden')}</p>
            <p className='text-xs text-altwhite'>{t('settings.achievementUnlocker.hidden.description')}</p>
          </div>
          <SettingsSwitch type='achievementUnlocker' name='hidden' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('common.nextTask')}</p>
            <p className='text-xs text-altwhite'>{t('settings.achievementUnlocker.nextTask.description')}</p>
          </div>
          <div className='flex items-center gap-4'>
            <Select
              aria-label='nextTask'
              disallowEmptySelection
              radius='none'
              items={taskOptions}
              className='w-[200px]'
              placeholder={t('common.nextTask.selectPlaceholder')}
              classNames={{
                listbox: ['p-0'],
                value: ['text-sm !text-content'],
                trigger: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'data-[open=true]:!bg-input duration-100 rounded-lg',
                ),
                popoverContent: ['bg-input rounded-xl justify-start !text-content'],
              }}
              isDisabled={!userSettings.achievementUnlocker.nextTaskCheckbox}
              defaultSelectedKeys={
                userSettings.achievementUnlocker.nextTask ? [userSettings.achievementUnlocker.nextTask] : []
              }
              onSelectionChange={e => {
                handleNextTaskChange(e.currentKey!, userSummary, setUserSettings)
              }}
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

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.achievementUnlocker.scheduleLabel')}</p>
            <p className='text-xs text-altwhite'>{t('settings.achievementUnlocker.schedule.description')}</p>
          </div>
          <div className='flex items-center gap-4'>
            <TimeInput
              aria-label='schedule-from'
              isDisabled={!userSettings?.achievementUnlocker?.schedule}
              value={userSettings?.achievementUnlocker?.scheduleFrom}
              size='sm'
              className='w-[95px]'
              classNames={{
                inputWrapper: cn(
                  'rounded-lg min-h-[25px] max-h-[25px] bg-input',
                  'hover:bg-inputhover border border-border',
                  'focus-within:!bg-inputhover',
                ),
                segment: ['!text-content'],
                input: ['text-sm'],
              }}
              onChange={value => handleScheduleChange(value, 'scheduleFrom', userSummary, setUserSettings)}
            />

            <p className='text-sm'>{t('settings.achievementUnlocker.scheduleTo')}</p>

            <TimeInput
              aria-label='schedule-to'
              isDisabled={!userSettings?.achievementUnlocker?.schedule}
              value={userSettings?.achievementUnlocker?.scheduleTo}
              size='sm'
              className='w-[95px]'
              classNames={{
                inputWrapper: cn(
                  'rounded-lg min-h-[25px] max-h-[25px] bg-input',
                  'hover:bg-inputhover border border-border',
                  'focus-within:!bg-inputhover',
                ),
                segment: ['!text-content'],
                input: ['text-sm'],
              }}
              onChange={value => handleScheduleChange(value, 'scheduleTo', userSummary, setUserSettings)}
            />
            <SettingsSwitch type='achievementUnlocker' name='schedule' />
          </div>
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.achievementUnlocker.unlockInterval')}</p>
            <p className='text-xs text-altwhite'>{sliderLabel}</p>
          </div>
          <Slider
            size='md'
            step={1}
            minValue={1}
            maxValue={2880}
            defaultValue={userSettings?.achievementUnlocker?.interval}
            formatOptions={{ style: 'currency', currency: 'USD' }}
            hideValue
            className='mt-2 w-[350px]'
            classNames={{
              track: 'bg-input',
              filler: 'bg-dynamic',
              thumb: 'bg-dynamic',
            }}
            onChangeEnd={e => handleSliderChange(e, userSummary, setUserSettings)}
            onChange={e => {
              if (Array.isArray(e)) {
                setSliderLabel(
                  t('settings.achievementUnlocker.interval', {
                    min: e[0],
                    max: e[1],
                  }),
                )
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
