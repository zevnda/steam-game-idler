import type { OrderGraphEntry } from '@/shared/types'

export interface TradingCard {
  appid: number
  assetid: string
  full_name: string
  href: string
  id: string
  image: string
  appname: string
  market_hash_name: string
  badge_level: number
  foil: boolean
  item_type?: string
  price_data: {
    lowest_sell_order: string
    highest_buy_order: string
    sell_order_graph: OrderGraphEntry[]
    buy_order_graph: OrderGraphEntry[]
    buy_order_summary: string
    sell_order_summary: string
  }
}
