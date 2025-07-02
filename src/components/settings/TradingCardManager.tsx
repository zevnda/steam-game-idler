import type { InvokeSettings } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { cn, NumberInput } from '@heroui/react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { useUserContext } from '@/components/contexts/UserContext'
import Beta from '@/components/ui/Beta'

export default function TradingCardManager(): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0.0)
  const [sellLimitMin, setSellLimitMin] = useState<number>(0.01)
  const [sellLimitMax, setSellLimitMax] = useState<number>(1.1)

  useEffect(() => {
    setPriceAdjustment(userSettings?.tradingCards?.priceAdjustment || 0.0)
    setSellLimitMin(userSettings?.tradingCards?.sellLimit?.min || 0.01)
    setSellLimitMax(userSettings?.tradingCards?.sellLimit?.max || 1.1)
  }, [userSettings?.tradingCards?.priceAdjustment, userSettings?.tradingCards?.sellLimit])

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

  return (
    <div className='relative flex flex-col gap-4'>
      <div className='flex flex-col gap-4 border border-border rounded-lg p-3 bg-titlebar'>
        <p className='font-bold'>{t('common.options')}</p>

        <div className='flex flex-col gap-2 w-full'>
          <div className='flex flex-col'>
            <p className='text-sm'>
              {t('tradingCards.priceAdjustment')}
              <Beta className='ml-1' />
            </p>
            <p className='text-xs text-altwhite'>
              <Trans
                i18nKey='tradingCards.priceAdjustmentSub'
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
                'bg-input border border-border hover:!bg-inputhover rounded-lg',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:!border-red-500',
                'border group-data-[invalid=true]:!bg-red-500/10',
              ),
              input: ['text-sm !text-content'],
            }}
            onValueChange={handlePriceAdjustmentChange}
          />
        </div>

        <div className='flex flex-col gap-2 w-full'>
          <div className='flex flex-col'>
            <p className='text-sm'>
              {t('tradingCards.sellLimit')}
              <Beta className='ml-1' />
            </p>
            <p className='text-xs text-altwhite'>
              <Trans
                i18nKey='tradingCards.sellLimitSub'
                values={{ sellLimitMin, sellLimitMax }}
                components={{ 1: <strong />, 3: <strong /> }}
              />
            </p>
          </div>
          <div className='flex items-center gap-2'>
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
                  'bg-input border border-border hover:!bg-inputhover rounded-lg',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                  'group-data-[focus-within=true]:!bg-inputhover',
                  'border group-data-[invalid=true]:!border-red-500',
                  'border group-data-[invalid=true]:!bg-red-500/10',
                ),
                input: ['text-sm !text-content'],
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
                  'bg-input border border-border hover:!bg-inputhover rounded-lg',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                  'group-data-[focus-within=true]:!bg-inputhover',
                  'border group-data-[invalid=true]:!border-red-500',
                  'border group-data-[invalid=true]:!bg-red-500/10',
                ),
                input: ['text-sm !text-content'],
              }}
              onValueChange={handleSellLimitMaxChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
