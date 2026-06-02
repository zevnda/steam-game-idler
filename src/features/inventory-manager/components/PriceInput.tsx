import type { TradingCard } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbPackageExport, TbRefresh } from 'react-icons/tb'
import { Button, cn, NumberInput, Spinner } from '@heroui/react'
import { CustomTooltip } from '@/shared/components/CustomTooltip'

interface PriceInputProps {
  card: TradingCard
  adjustedPrice: number
  isLoadingPrice: boolean
  onFetchPrice: () => void
  onPriceChange: (value: number) => void
  isPro: boolean
}

export function PriceInput({
  card,
  adjustedPrice,
  isLoadingPrice,
  onFetchPrice,
  onPriceChange,
  isPro,
}: PriceInputProps) {
  const { t } = useTranslation()

  return (
    <div className='flex items-center justify-center gap-1 mt-2'>
      <NumberInput
        isDisabled={!isPro}
        size='sm'
        value={adjustedPrice}
        maxValue={99999}
        defaultValue={0}
        step={0.01}
        formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        aria-label='card price'
        className='w-21.25'
        classNames={{
          inputWrapper: cn(
            'bg-input data-[hover=true]:!bg-inputhover border-none group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent group-data-[focus-within=true]:!bg-inputhover',
          ),
          input: ['text-sm !text-content'],
        }}
        onValueChange={onPriceChange}
      />

      {isLoadingPrice ? (
        <Spinner size='sm' variant='simple' className='w-8' />
      ) : (
        <CustomTooltip content={t('tradingCards.fetchPrice')} placement='top'>
          <Button
            isIconOnly
            size='sm'
            className='bg-btn-secondary text-btn-text'
            radius='full'
            onPress={onFetchPrice}
          >
            <TbRefresh size={14} />
          </Button>
        </CustomTooltip>
      )}

      <CustomTooltip content={t('common.list')} placement='top'>
        <Button
          isIconOnly
          className='bg-btn-secondary text-btn-text font-bold'
          radius='full'
          isDisabled={!isPro || adjustedPrice <= 0}
          onPress={() => {
            /* handled by parent */
          }}
          size='sm'
        >
          <TbPackageExport size={14} />
        </Button>
      </CustomTooltip>
    </div>
  )
}
