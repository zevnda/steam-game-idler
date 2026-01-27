import type { ReactElement } from 'react'

import { Alert, cn, Divider, Select, SelectItem } from '@heroui/react'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'

import SettingsSwitch from '@/components/settings/SettingsSwitch'
import { handleNextTaskChange, useCardSettings } from '@/hooks/settings/useCardSettings'

export default function CardSettings(): ReactElement {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const cardSettings = useCardSettings()

  const taskOptions = [
    {
      key: 'achievementUnlocker',
      label: t('common.achievementUnlocker'),
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
        <p className='text-3xl font-black'>{t('common.cardFarming')}</p>

        {!cardSettings.cardFarmingUser && (
          <div className='mt-4'>
            <Alert
              color='primary'
              variant='faded'
              classNames={{
                base: '!bg-dynamic/30 text-dynamic !border-dynamic/40',
                iconWrapper: '!bg-dynamic/30 border-dynamic/40',
                description: 'font-bold text-xs',
              }}
              description={t('settings.cardFarming.alert')}
            />
          </div>
        )}
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.cardFarming.listGames')}</p>
            <p className='text-xs text-altwhite'>{t('settings.cardFarming.listGames.description')}</p>
          </div>
          <SettingsSwitch type='cardFarming' name='listGames' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.cardFarming.allGames')}</p>
            <p className='text-xs text-altwhite'>{t('settings.cardFarming.allGames.description')}</p>
          </div>
          <SettingsSwitch type='cardFarming' name='allGames' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.cardFarming.skipNoPlaytime')}</p>
            <p className='text-xs text-altwhite'>{t('settings.cardFarming.skipNoPlaytime.description')}</p>
          </div>
          <SettingsSwitch type='cardFarming' name='skipNoPlaytime' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('common.nextTask')}</p>
            <p className='text-xs text-altwhite'>{t('settings.cardFarming.nextTask.description')}</p>
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
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'data-[open=true]:!bg-input duration-100 rounded-lg',
                ),
                popoverContent: ['bg-input rounded-xl justify-start !text-content'],
              }}
              isDisabled={!userSettings.cardFarming.nextTaskCheckbox}
              defaultSelectedKeys={userSettings.cardFarming.nextTask ? [userSettings.cardFarming.nextTask] : []}
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

            <SettingsSwitch type='cardFarming' name='nextTaskCheckbox' />
          </div>
        </div>
      </div>
    </div>
  )
}
