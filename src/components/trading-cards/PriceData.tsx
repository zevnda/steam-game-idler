import type useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'
import type { TradingCard } from '@/types'
import type { ReactElement } from 'react'

import { Spinner } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbArrowsHorizontal, TbCaretDownFilled } from 'react-icons/tb'

interface PriceDataProps {
  item: TradingCard
  tradingCardContext: ReturnType<typeof useTradingCardsList>
}

export default function PriceData({ item, tradingCardContext }: PriceDataProps): ReactElement {
  const { t } = useTranslation()

  return (
    <div className='flex justify-center items-center h-full mt-1.5'>
      {tradingCardContext.loadingItemPrice[item.market_hash_name] ? (
        <Spinner variant='simple' size='sm' />
      ) : !item.price_data ? (
        <p
          className='text-xs text-content cursor-pointer hover:opacity-80'
          onClick={() => tradingCardContext.fetchCardPrices(item.market_hash_name)}
        >
          {t('tradingCards.fetchPrice')}
        </p>
      ) : (
        <div className='flex justify-center items-center gap-3 text-xs'>
          <div
            className='flex items-center cursor-pointer hover:opacity-80'
            onClick={() => {
              if (item.price_data?.lowest_price) {
                const price = parseFloat(item.price_data.lowest_price)
                tradingCardContext.updateCardPrice(item.assetid, price)
              } else {
                tradingCardContext.updateCardPrice(item.assetid, 0)
              }
            }}
          >
            <TbCaretDownFilled className='text-danger' />
            <p>{item.price_data.lowest_price || '0.00'}</p>
          </div>

          <div
            className='flex items-center cursor-pointer hover:opacity-80'
            onClick={() => {
              if (item.price_data?.median_price) {
                const price = parseFloat(item.price_data.median_price)
                tradingCardContext.updateCardPrice(item.assetid, price)
              } else {
                tradingCardContext.updateCardPrice(item.assetid, 0)
              }
            }}
          >
            <TbArrowsHorizontal className='text-success' />
            <p>{item.price_data.median_price || '0.00'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
