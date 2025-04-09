import type useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'
import type { TradingCard } from '@/types'
import type { ReactElement } from 'react'

import { Button, cn, NumberInput, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbCurrencyDollar } from 'react-icons/tb'

import CustomModal from '@/components/ui/CustomModal'

interface PriceInputProps {
  item: TradingCard
  tradingCardContext: ReturnType<typeof useTradingCardsList>
}

export default function PriceInput({ item, tradingCardContext }: PriceInputProps): ReactElement {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <>
      <div className='flex items-center justify-center gap-1 mt-2'>
        <NumberInput
          hideStepper
          isInvalid={
            tradingCardContext.selectedCards[item.assetid] && tradingCardContext.getCardPriceValue(item.assetid) <= 0
          }
          size='sm'
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
          startContent={<TbCurrencyDollar className='text-altwhite' size={18} />}
          className='w-[85px]'
          classNames={{
            inputWrapper: cn(
              'bg-input border border-border hover:!bg-inputhover rounded-lg h-6',
              'group-data-[focus-visible=true]:ring-transparent',
              'group-data-[focus-visible=true]:ring-offset-transparent',
              'group-data-[focus-within=true]:!bg-inputhover',
              'border group-data-[invalid=true]:!border-red-500',
              'border group-data-[invalid=true]:!bg-red-500/10',
            ),
            input: ['text-sm !text-content'],
          }}
          onValueChange={value => tradingCardContext.updateCardPrice(item.assetid, value)}
        />

        <Button
          size='sm'
          isLoading={tradingCardContext.loadingListButton}
          isDisabled={tradingCardContext.loadingListButton || tradingCardContext.getCardPriceValue(item.assetid) <= 0}
          className='font-semibold rounded-lg bg-dynamic text-button-text'
          onPress={onOpen}
        >
          {!tradingCardContext.loadingListButton && t('common.list')}
        </Button>
      </div>

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.notice')}
        body={<div className='whitespace-pre-line'>{t('tradingCards.confirmSingle')}</div>}
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              className='font-semibold rounded-lg'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              onPress={() => {
                tradingCardContext.handleSellSingleCard(
                  item.assetid,
                  tradingCardContext.getCardPriceValue(item.assetid),
                )
                onOpenChange()
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
