// Mirrors src-tauri/src/inventory/mod.rs (serde `rename_all = "camelCase"`). Despite `main`'s
// "trading cards" framing, this covers every marketable Steam Community item type sharing the
// `item_class_N` tag family (trading cards, backgrounds, emoticons, boosters, sale items) - see
// that Rust module's doc comment. Naming throughout this feature says "inventory"/"item", not
// "card", for the same reason.
export interface InventoryItem {
  id: string
  assetid: string
  appId: number
  image: string
  href: string
  appName: string
  fullName: string
  marketHashName: string
  badgeLevel: number
  itemType: string
  foil: boolean
  priceData?: PriceData
}

// `[price, quantity, formatted label]` - mirrors Rust's `OrderGraphEntry` tuple exactly.
export type OrderGraphEntry = [number, number, string]

export interface PriceData {
  sellOrderGraph: OrderGraphEntry[]
  buyOrderGraph: OrderGraphEntry[]
  highestBuyOrder?: number
  lowestSellOrder?: number
  buyOrderSummary: string
  sellOrderSummary: string
}

export interface ListingResult {
  assetid: string
  success: boolean
  message?: string
  needsEmailConfirmation: boolean
  needsMobileConfirmation: boolean
}

export interface ListItemsResult {
  results: ListingResult[]
  total: number
  successful: number
}

export interface RemovedListing {
  listingId: string
  assetId: string
  success: boolean
}

export interface RemoveListingsResult {
  totalListings: number
  processedListings: number
  results: RemovedListing[]
  successfulRemovals: number
}

// Mirrors src-tauri/src/inventory/settings.rs. Renamed/typed vs. `main`'s `tradingCards` settings
// category the same way the Rust struct was - these preferences govern selling whatever gets
// listed through this feature, not trading cards specifically.
export type PricePreference = 'highestBuyOrder' | 'lowestSellOrder'

export interface SellLimit {
  min: number
  max: number
}

export interface InventorySettings {
  pricePreference: PricePreference
  priceAdjustment: number
  sellLimit: SellLimit
  sellDelay: number
  /** Steam currency ID, e.g. "1" = USD - see `../utils/currency.ts`'s `STEAM_CURRENCY_ISO`. */
  currency: string
}

// Mirrors src-tauri/src/steam_community/mod.rs::SteamCookies. Each cookie-authenticated feature
// keeps its own copy of this shape (card-farming has one too) rather than a shared frontend type -
// see that feature's own types.ts for the precedent this follows.
export interface SteamCookies {
  sid: string
  sls: string
  sma?: string
}
