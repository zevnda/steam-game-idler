import type { useTradingCardsList } from '@/features/inventory-manager'
import type { TradingCard } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbArrowRight } from 'react-icons/tb'
import { Button, cn, Spinner, useDisclosure } from '@heroui/react'
import { CustomModal, showPriceFetchCooldownToast } from '@/shared/components'
import { formatCurrency, logEvent } from '@/shared/utils'

interface OrderTableProps {
  title: string
  summary?: string
  rows?: unknown[]
  onRowClick: (price: number) => void
}

const OrderTable = ({ title, summary, rows, onRowClick }: OrderTableProps) => {
  const { t } = useTranslation()
  const typedRows = Array.isArray(rows) ? (rows as [number, number][]) : []

  return (
    <div className='flex flex-col gap-2 flex-1 min-w-0'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-sm font-bold'>{title}</p>
        {summary && <span className='text-xs text-altwhite shrink-0'>{summary}</span>}
      </div>
      <div className='rounded-lg border border-border overflow-hidden'>
        <table className='text-xs w-full'>
          <thead>
            <tr className='bg-content/10'>
              <th className='px-3 py-2 text-left font-semibold text-altwhite'>
                {t('tradingCards.priceData.price')}
              </th>
              <th className='px-3 py-2 text-right font-semibold text-altwhite'>
                {t('tradingCards.priceData.quantity')}
              </th>
            </tr>
          </thead>
          <tbody>
            {typedRows.length > 0 ? (
              typedRows.map((row, index) => (
                <tr
                  key={row[0]}
                  className={cn(
                    'border-t border-border/50 cursor-pointer transition-colors duration-100 hover:bg-content/10',
                    index % 2 !== 0 && 'bg-content/5',
                  )}
                  onClick={() => onRowClick(row[0])}
                >
                  <td className='px-3 py-2 text-left text-dynamic'>{formatCurrency(row[0])}</td>
                  <td className='px-3 py-2 text-right'>{row[1]}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className='px-3 py-4 text-center text-altwhite'>
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

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

      if (item.price_data) {
        onOpen()
        return
      }

      if (now < cooldown) {
        const secondsLeft = Math.ceil((cooldown - now) / 1000)
        showPriceFetchCooldownToast(secondsLeft)
        return
      }

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
        className='max-w-2xl'
        title={item.full_name}
        body={
          <div className='flex gap-4 w-full'>
            {!tradingCardContext.loadingItemPrice[item.market_hash_name] ? (
              <>
                <OrderTable
                  title={t('tradingCards.priceData.sellOrders')}
                  summary={item.price_data?.sell_order_summary}
                  rows={item.price_data?.sell_order_graph}
                  onRowClick={price => {
                    tradingCardContext.updateCardPrice(item.assetid, price)
                    onOpenChange()
                  }}
                />
                <OrderTable
                  title={t('tradingCards.priceData.buyOrders')}
                  summary={item.price_data?.buy_order_summary}
                  rows={item.price_data?.buy_order_graph}
                  onRowClick={price => {
                    tradingCardContext.updateCardPrice(item.assetid, price)
                    onOpenChange()
                  }}
                />
              </>
            ) : (
              <div className='flex justify-center w-full py-4'>
                <Spinner />
              </div>
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
