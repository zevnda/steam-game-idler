import type useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'
import type { TradingCard } from '@/types'
import type { ReactElement } from 'react'

import { Button, cn, NumberInput } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbPackageExport } from 'react-icons/tb'

import CustomTooltip from '@/components/ui/CustomTooltip'

interface PriceInputProps {
  item: TradingCard
  tradingCardContext: ReturnType<typeof useTradingCardsList>
}

export default function PriceInput({ item, tradingCardContext }: PriceInputProps): ReactElement {
  const { t } = useTranslation()

  return (
    <div className='flex items-center justify-center gap-1 mt-2'>
      <NumberInput
        size='sm'
        isInvalid={
          tradingCardContext.selectedCards[item.assetid] && tradingCardContext.getCardPriceValue(item.assetid) <= 0
        }
        value={tradingCardContext.getCardPriceValue(item.assetid)}
        maxValue={99999}
        defaultValue={0}
        step={0.01}
        formatOptions={{
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
        aria-label='statistic value'
        className='w-[85px]'
        classNames={{
          inputWrapper: cn(
            'bg-input data-[hover=true]:!bg-inputhover border-none',
            'group-data-[focus-visible=true]:ring-transparent',
            'group-data-[focus-visible=true]:ring-offset-transparent',
            'group-data-[focus-within=true]:!bg-inputhover',
            'border group-data-[invalid=true]:!border-red-500',
            'border group-data-[invalid=true]:!bg-red-500/10',
          ),
          input: ['text-sm !text-content'],
          stepperButton: ['!text-content', 'text-sm'],
        }}
        onValueChange={value => tradingCardContext.updateCardPrice(item.assetid, value)}
      />

      <CustomTooltip content={t('common.list')} placement='top'>
        <Button
          isIconOnly
          className='bg-btn-secondary text-btn-text font-bold'
          radius='full'
          isLoading={tradingCardContext.loadingListButton}
          isDisabled={tradingCardContext.loadingListButton || tradingCardContext.getCardPriceValue(item.assetid) <= 0}
          startContent={!tradingCardContext.loadingListButton && <TbPackageExport size={20} />}
          onPress={() => {
            tradingCardContext.handleSellSingleCard(
              item.assetid,
              item.id,
              tradingCardContext.getCardPriceValue(item.assetid),
            )
          }}
        />
      </CustomTooltip>
    </div>
  )
}
