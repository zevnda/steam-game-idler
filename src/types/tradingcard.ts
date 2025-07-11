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
  price_data: {
    lowest_price: string
    volume: string
    median_price: string
  }
}
