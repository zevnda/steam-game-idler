import type { useTradingCardsList } from '@/features/trading-card-manager'
import type { TradingCard } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbArrowRight } from 'react-icons/tb'
import { Button, cn, Spinner, useDisclosure } from '@heroui/react'
import { CustomModal, showPriceFetchCooldownToast } from '@/shared/components'
import { logEvent } from '@/shared/utils'

interface PriceDataProps {
  item: TradingCard
  tradingCardContext: ReturnType<typeof useTradingCardsList>
  isLocked?: boolean
}

export const PriceData = ({ item, tradingCardContext, isLocked }: PriceDataProps) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleFetchPrice = async (item: TradingCard) => {
    try {
      const cooldownKey = 'tcPriceFetchCooldown'
      const now = Date.now()
      const cooldown = Number(localStorage.getItem(cooldownKey)) || 0

      // If we already have price data, open the modal
      if (item.price_data) {
        onOpen()
        return
      }

      // If we are in cooldown and don't have price data, show toast and do not open modal
      if (now < cooldown) {
        const secondsLeft = Math.ceil((cooldown - now) / 1000)
        showPriceFetchCooldownToast(secondsLeft)
        return
      }

      // Not in cooldown, fetch price data, open modal and set new cooldown
      localStorage.setItem(cooldownKey, (now + 5_000).toString())
      onOpen()
      await tradingCardContext.fetchCardPrices(item.market_hash_name)
    } catch (error) {
      console.error('Error fetching price data:', error)
      logEvent(`[Error] in handleFetchPrice: ${error}`)
    }
  }

  return (
    <div className='flex justify-center items-center h-full mt-2'>
      <div
        className={cn(
          'flex justify-center items-center gap-2 text-xs text-content group w-36 duration-150 select-none',
          !isLocked && 'cursor-pointer hover:opacity-80',
        )}
        onClick={() => !isLocked && handleFetchPrice(item)}
      >
        <p className='truncate'>{t('tradingCards.fetchPrice')}</p>
        <TbArrowRight className={cn('duration-150', !isLocked && 'group-hover:translate-x-1')} />
      </div>

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={item.full_name}
        body={
          <div className='flex justify-center gap-4'>
            {!tradingCardContext.loadingItemPrice[item.market_hash_name] ? (
              <>
                <div className='flex flex-col gap-2'>
                  <p className='font-bold'>{t('tradingCards.priceData.sellOrders')}</p>
                  {item.price_data?.sell_order_summary && (
                    <p
                      className='text-xs text-altwhite'
                      dangerouslySetInnerHTML={{ __html: item.price_data.sell_order_summary }}
                    />
                  )}
                  <table className='text-xs border border-border w-37.5 h-fit'>
                    <thead>
                      <tr className='bg-content/5'>
                        <th className='px-2 py-1 text-center'>
                          {t('tradingCards.priceData.price')}
                        </th>
                        <th className='px-2 py-1 text-center'>
                          {t('tradingCards.priceData.quantity')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.price_data &&
                        Array.isArray(item.price_data.sell_order_graph) &&
                        item.price_data.sell_order_graph.map((row, index) => (
                          <tr key={row[0]} className='border-t border-content/10'>
                            <td
                              className='px-2 py-1 text-center text-dynamic hover:text-dynamic-hover cursor-pointer'
                              onClick={() => {
                                const numericPrice = item.price_data.sell_order_graph?.[index]?.[0]
                                  .toString()
                                  .replace(/[^0-9.,]/g, '')
                                  .replace(',', '.')
                                const price = parseFloat(numericPrice)
                                tradingCardContext.updateCardPrice(item.assetid, price)
                                onOpenChange()
                              }}
                            >
                              {row[0]}
                            </td>
                            <td className='px-2 py-1 text-center'>{row[1]}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className='flex flex-col gap-2'>
                  <p className='font-bold'>{t('tradingCards.priceData.buyOrders')}</p>
                  {item.price_data?.buy_order_summary && (
                    <p
                      className='text-xs text-altwhite'
                      dangerouslySetInnerHTML={{ __html: item.price_data.buy_order_summary }}
                    />
                  )}
                  <table className='text-xs border border-border w-37.5 h-fit'>
                    <thead>
                      <tr className='bg-content/5'>
                        <th className='px-2 py-1 text-center'>
                          {t('tradingCards.priceData.price')}
                        </th>
                        <th className='px-2 py-1 text-center'>
                          {t('tradingCards.priceData.quantity')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.price_data &&
                        Array.isArray(item.price_data.buy_order_graph) &&
                        item.price_data.buy_order_graph.map((row, index) => (
                          <tr key={row[0]} className='border-t border-content/10'>
                            <td
                              className='px-2 py-1 text-center text-dynamic hover:text-dynamic-hover cursor-pointer'
                              onClick={() => {
                                const numericPrice = item.price_data.buy_order_graph?.[index]?.[0]
                                  .toString()
                                  .replace(/[^0-9.,]/g, '')
                                  .replace(',', '.')
                                const price = parseFloat(numericPrice)
                                tradingCardContext.updateCardPrice(item.assetid, price)
                                onOpenChange()
                              }}
                            >
                              {row[0]}
                            </td>
                            <td className='px-2 py-1 text-center'>{row[1]}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <Spinner />
            )}
          </div>
        }
        buttons={
          <Button
            size='sm'
            color='danger'
            variant='light'
            radius='full'
            className='font-semibold'
            onPress={onOpenChange}
          >
            {t('common.close')}
          </Button>
        }
      />
    </div>
  )
}
