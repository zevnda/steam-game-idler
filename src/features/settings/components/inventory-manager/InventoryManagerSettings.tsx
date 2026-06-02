import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'
import { cn, Divider, NumberInput, Select, SelectItem } from '@heroui/react'
import {
  handlePriceAdjustmentChange,
  handleSellDelayChange,
  handleSellLimitMaxChange,
  handleSellLimitMinChange,
  handleSellOptionChange,
} from '@/features/settings/services/inventoryService'
import { useUserStore } from '@/shared/stores'

export function InventoryManagerSettings() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const [priceAdj, setPriceAdj] = useState(0.0)
  const [sellLimitMin, setSellLimitMin] = useState(0.01)
  const [sellLimitMax, setSellLimitMax] = useState(1.1)
  const [sellDelay, setSellDelay] = useState(10)

  useEffect(() => {
    setPriceAdj(userSettings?.tradingCards?.priceAdjustment || 0.0)
    setSellLimitMin(userSettings?.tradingCards?.sellLimit?.min || 0.01)
    setSellLimitMax(userSettings?.tradingCards?.sellLimit?.max || 1.1)
    setSellDelay(userSettings?.tradingCards?.sellDelay || 10)
  }, [userSettings?.tradingCards])

  const sellOptions = [
    { key: 'highestBuyOrder', label: t('settings.tradingCards.sellOptions.highestBuyOrder') },
    { key: 'lowestSellOrder', label: t('settings.tradingCards.sellOptions.lowestSellOrder') },
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
        <p className='text-3xl font-black'>{t('tradingCards.title')}</p>
      </div>
      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.tradingCards.sellOptions')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.tradingCards.sellOptions.description')}
            </p>
          </div>
          <Select
            aria-label='sellOptions'
            disallowEmptySelection
            radius='none'
            items={sellOptions}
            className='w-50'
            defaultSelectedKeys={[userSettings?.tradingCards?.sellOptions || 'highestBuyOrder']}
            classNames={{
              listbox: ['p-0'],
              value: ['text-sm !text-content'],
              trigger: cn(
                'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-lg',
              ),
              popoverContent: ['bg-input rounded-xl justify-start !text-content'],
            }}
            onSelectionChange={e =>
              handleSellOptionChange(e.currentKey!, userSummary, setUserSettings)
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
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.tradingCards.priceAdjustment')}
            </p>
            <p className='text-xs text-altwhite'>{t('settings.tradingCards.priceAdjustmentSub')}</p>
          </div>
          <NumberInput
            aria-label='priceAdjustment'
            value={priceAdj}
            minValue={-0.99}
            maxValue={0.99}
            step={0.01}
            formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            className='w-32'
            classNames={{
              inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
              input: ['!text-content'],
            }}
            onValueChange={v =>
              handlePriceAdjustmentChange(v, userSummary, setUserSettings, setPriceAdj)
            }
          />
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.tradingCards.sellLimit')}</p>
            <p className='text-xs text-altwhite'>{t('settings.tradingCards.sellLimitSub')}</p>
          </div>
          <div className='flex items-center gap-2'>
            <NumberInput
              aria-label='sellLimitMin'
              value={sellLimitMin}
              minValue={0.01}
              maxValue={sellLimitMax}
              step={0.01}
              formatOptions={{ style: 'currency', currency: 'USD' }}
              className='w-28'
              classNames={{
                inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                input: ['!text-content'],
              }}
              onValueChange={v =>
                handleSellLimitMinChange(
                  v,
                  userSummary,
                  setUserSettings,
                  sellLimitMax,
                  setSellLimitMin,
                )
              }
            />
            <p className='text-sm text-altwhite'>—</p>
            <NumberInput
              aria-label='sellLimitMax'
              value={sellLimitMax}
              minValue={sellLimitMin}
              maxValue={100}
              step={0.01}
              formatOptions={{ style: 'currency', currency: 'USD' }}
              className='w-28'
              classNames={{
                inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                input: ['!text-content'],
              }}
              onValueChange={v =>
                handleSellLimitMaxChange(
                  v,
                  userSummary,
                  setUserSettings,
                  sellLimitMin,
                  setSellLimitMax,
                )
              }
            />
          </div>
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.tradingCards.sellDelay')}</p>
            <p className='text-xs text-altwhite'>{t('settings.tradingCards.sellDelaySub')}</p>
          </div>
          <NumberInput
            aria-label='sellDelay'
            value={sellDelay}
            minValue={0}
            maxValue={60}
            step={1}
            className='w-32'
            classNames={{
              inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
              input: ['!text-content'],
            }}
            onValueChange={v =>
              handleSellDelayChange(v, userSummary, setUserSettings, setSellDelay)
            }
          />
        </div>
      </div>
    </div>
  )
}
