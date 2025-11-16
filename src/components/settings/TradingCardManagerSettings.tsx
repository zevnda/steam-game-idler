import type { InvokeSettings, UserSettings, UserSummary } from '@/types'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Alert, cn, Divider, NumberInput, Select, SelectItem } from '@heroui/react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'

import { useUserContext } from '@/components/contexts/UserContext'
import { useCardSettings } from '@/hooks/settings/useCardSettings'

export default function TradingCardManagerSettings(): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const cardSettings = useCardSettings()
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0.0)
  const [sellLimitMin, setSellLimitMin] = useState<number>(0.01)
  const [sellLimitMax, setSellLimitMax] = useState<number>(1.1)
  const [sellDelay, setSellDelay] = useState<number>(3)

  useEffect(() => {
    setPriceAdjustment(userSettings?.tradingCards?.priceAdjustment || 0.0)
    setSellLimitMin(userSettings?.tradingCards?.sellLimit?.min || 0.01)
    setSellLimitMax(userSettings?.tradingCards?.sellLimit?.max || 1.1)
    setSellDelay(userSettings?.tradingCards?.sellDelay || 3)
  }, [
    userSettings?.tradingCards?.priceAdjustment,
    userSettings?.tradingCards?.sellLimit,
    userSettings?.tradingCards?.sellDelay,
  ])

  const sellOptions = [
    {
      key: 'highestBuyOrder',
      label: t('settings.tradingCards.sellOptions.highestBuyOrder'),
    },
    {
      key: 'lowestSellOrder',
      label: t('settings.tradingCards.sellOptions.lowestSellOrder'),
    },
  ]

  const handleSellOptionChange = async (
    key: string,
    userSummary: UserSummary,
    setUserSettings: Dispatch<SetStateAction<UserSettings>>,
  ): Promise<void> => {
    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'tradingCards.sellOptions',
      value: key,
    })

    setUserSettings(updateResponse.settings)
  }

  const handlePriceAdjustmentChange = async (value: number): Promise<void> => {
    setPriceAdjustment(value)
    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'tradingCards.priceAdjustment',
      value,
    })

    setUserSettings(updateResponse.settings)
  }

  const handleSellLimitMinChange = async (value: number): Promise<void> => {
    setSellLimitMin(value)
    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'tradingCards.sellLimit',
      value: {
        min: value,
        max: sellLimitMax,
      },
    })

    setUserSettings(updateResponse.settings)
  }

  const handleSellLimitMaxChange = async (value: number): Promise<void> => {
    setSellLimitMax(value)
    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'tradingCards.sellLimit',
      value: {
        min: sellLimitMin,
        max: value,
      },
    })

    setUserSettings(updateResponse.settings)
  }

  const handleSellDelayChange = async (value: number): Promise<void> => {
    setSellDelay(value)
    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'tradingCards.sellDelay',
      value,
    })

    setUserSettings(updateResponse.settings)
  }

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('tradingCards.title')}</p>

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
              description={t('settings.tradingCards.alert')}
            />
          </div>
        )}
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.tradingCards.sellOptions')}</p>
            <p className='text-xs text-altwhite'>{t('settings.tradingCards.sellOptions.description')}</p>
          </div>
          <div className='flex items-center gap-4'>
            <Select
              aria-label='sellOptions'
              disallowEmptySelection
              radius='none'
              items={sellOptions}
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
              defaultSelectedKeys={
                userSettings.tradingCards?.sellOptions ? [userSettings.tradingCards?.sellOptions] : []
              }
              onSelectionChange={e => {
                handleSellOptionChange(e.currentKey!, userSummary, setUserSettings)
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
          </div>
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.tradingCards.priceAdjustment')}</p>
            <p className='text-xs text-altwhite'>
              <Trans
                i18nKey='settings.tradingCards.priceAdjustmentSub'
                values={{ priceAdjustment }}
                components={{ 1: <strong /> }}
              />
            </p>
          </div>
          <NumberInput
            size='sm'
            value={priceAdjustment}
            formatOptions={{
              style: 'decimal',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
            step={0.01}
            aria-label='price adjustment value'
            className='w-[90px]'
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover border-none',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:border-red-500!',
                'border group-data-[invalid=true]:bg-red-500/10!',
              ),
              input: ['text-sm !text-content'],
              stepperButton: ['!text-content', 'text-sm'],
            }}
            onValueChange={handlePriceAdjustmentChange}
          />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.tradingCards.sellLimit')}</p>
            <p className='text-xs text-altwhite'>
              <Trans
                i18nKey='settings.tradingCards.sellLimitSub'
                values={{ sellLimitMin, sellLimitMax }}
                components={{ 1: <strong />, 3: <strong /> }}
              />
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <NumberInput
              size='sm'
              value={sellLimitMin}
              formatOptions={{
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
              minValue={0.01}
              step={0.01}
              aria-label='sell limit minimum value'
              className='w-[90px]'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover border-none',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                  'group-data-[focus-within=true]:!bg-inputhover',
                  'border group-data-[invalid=true]:border-red-500!',
                  'border group-data-[invalid=true]:bg-red-500/10!',
                ),
                input: ['text-sm !text-content'],
                stepperButton: ['!text-content', 'text-sm'],
              }}
              onValueChange={handleSellLimitMinChange}
            />
            <NumberInput
              size='sm'
              value={sellLimitMax}
              formatOptions={{
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
              step={0.01}
              aria-label='sell limit maximum value'
              className='w-[90px]'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover border-none',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                  'group-data-[focus-within=true]:!bg-inputhover',
                  'border group-data-[invalid=true]:border-red-500!',
                  'border group-data-[invalid=true]:bg-red-500/10!',
                ),
                input: ['text-sm !text-content'],
                stepperButton: ['!text-content', 'text-sm'],
              }}
              onValueChange={handleSellLimitMaxChange}
            />
          </div>
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.tradingCards.sellDelay')}</p>
            <p className='text-xs text-altwhite'>
              <Trans
                i18nKey='settings.tradingCards.sellDelaySub'
                values={{ sellDelay }}
                components={{ 1: <strong /> }}
              />
            </p>
          </div>
          <NumberInput
            size='sm'
            value={sellDelay}
            step={1}
            minValue={3}
            maxValue={15}
            aria-label='sell delay value'
            className='w-[90px]'
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover border-none',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:border-red-500!',
                'border group-data-[invalid=true]:bg-red-500/10!',
              ),
              input: ['text-sm !text-content'],
              stepperButton: ['!text-content', 'text-sm'],
            }}
            onValueChange={handleSellDelayChange}
          />
        </div>
      </div>
    </div>
  )
}
