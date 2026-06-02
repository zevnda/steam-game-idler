export type OrderGraphEntry = [number, number, string]

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

export interface InvokeCardData {
  success: boolean
  card_data: TradingCard[]
}

export interface InvokeCardPrice {
  success: boolean
  sell_order_graph?: OrderGraphEntry[]
  buy_order_graph?: OrderGraphEntry[]
  highest_buy_order?: string
  lowest_sell_order?: string
  buy_order_summary?: string
  sell_order_summary?: string
  error?: string
}

export interface InvokeListCards {
  results: {
    assetid: string
    message?: string
    data?: {
      email_domain: string
      needs_email_confirmation: boolean
      needs_mobile_confirmation: boolean
      requires_confirmation: number
      success: boolean
    }
    success: boolean
  }[]
  successful: number
  total: number
}

export interface InvokeRemoveListings {
  total_listings: number
  processed_listings: number
  results: {
    listing_id: string
    asset_id: string
    success: boolean
  }[]
  successful_removals: number
}
