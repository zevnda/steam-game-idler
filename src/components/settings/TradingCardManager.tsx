import type { InvokeSettings } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { cn, NumberInput } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useUserContext } from '@/components/contexts/UserContext'

export default function TradingCardManager(): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0.0)

  useEffect(() => {
    setPriceAdjustment(userSettings?.tradingCards?.priceAdjustment || 0.0)
  }, [userSettings?.tradingCards?.priceAdjustment])

  const handlePriceAdjustmentChange = async (value: number): Promise<void> => {
    setPriceAdjustment(value)
    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'tradingCards',
      value: {
        priceAdjustment: value,
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
            <p className='text-sm'>{t('tradingCards.priceAdjustment')}</p>
            <p className='text-xs text-altwhite'>
              Add or subtract $<span className='font-bold'>{priceAdjustment}</span> from the sale price of all sales
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
      </div>
    </div>
  )
}
