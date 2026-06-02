import type { TradingCard } from '@/shared/types'
import { cn } from '@heroui/react'

const CURRENCY_CODE: Record<string, string> = {
  '1': 'USD',
  '2': 'GBP',
  '3': 'EUR',
  '5': 'RUB',
  '6': 'PLN',
  '7': 'BRL',
  '8': 'JPY',
  '11': 'MYR',
  '12': 'PHP',
  '13': 'SGD',
  '14': 'THB',
  '17': 'TRY',
  '18': 'UAH',
  '20': 'CAD',
  '21': 'AUD',
  '23': 'CNY',
  '24': 'INR',
}

function formatPrice(cents: string, currencyCode?: string) {
  const num = Number(cents) / 100
  const currency = currencyCode || CURRENCY_CODE[localStorage.getItem('currency') || '1'] || 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(num)
  } catch {
    return `$${num.toFixed(2)}`
  }
}

interface PriceDataProps {
  card: TradingCard
}

export function PriceData({ card }: PriceDataProps) {
  const currency = localStorage.getItem('currency') || '1'
  const currencyCode = CURRENCY_CODE[currency] || 'USD'

  const hasPrice = card.price_data?.highest_buy_order || card.price_data?.lowest_sell_order

  if (!hasPrice) return null

  return (
    <div className={cn('flex justify-between items-center text-[10px] text-altwhite px-1')}>
      {card.price_data?.highest_buy_order && (
        <span>{formatPrice(card.price_data.highest_buy_order, currencyCode)}</span>
      )}
      {card.price_data?.lowest_sell_order && (
        <span>{formatPrice(card.price_data.lowest_sell_order, currencyCode)}</span>
      )}
    </div>
  )
}
