// Mirrors src-tauri/src/card_farming/mod.rs's `SteamCookies`/`GameWithDrops`/`FarmingProgress`/
// `FarmingState` (serde `rename_all = "camelCase"`).
export interface SteamCookies {
  sid: string
  sls: string
  sma?: string
}

export interface GameWithDrops {
  appId: number
  name: string
  remaining: number
  playtimeHours: number
}

// Mirrors `card_farming::CardFarmingQueueEntry` - one entry in the account's curated card-farming
// queue (see `card_farming::queue`'s doc comment). `start_farming` only ever farms games with
// drops remaining that are also in this queue.
export interface CardFarmingQueueEntry {
  appId: number
  name: string
}

// Mirrors `card_farming::CardFarmingBlacklistEntry` - a game excluded from ever being farmed or
// shown in the "Games With Drops" browse tab. See that Rust struct's doc comment for why this is
// its own list (own file, own commands) rather than a field on `CardFarmingSettings`.
export interface CardFarmingBlacklistEntry {
  appId: number
  name: string
}

export interface FarmingProgress {
  appId: number
  name: string
  initialRemaining: number
  remaining: number
  playtimeHours: number
}

// Mirrors src-tauri/src/card_farming/mod.rs::CompletedFarmReason.
export type CompletedFarmReason =
  'dropsExhausted' | 'maxCardDrops' | 'maxCardFarmingTime' | 'maxPlaytime' | 'noDropsRemaining'

// Mirrors src-tauri/src/card_farming/mod.rs::CompletedFarm.
export interface CompletedFarm {
  appId: number
  name: string
  remaining: number
  reason: CompletedFarmReason
}

export interface FarmingState {
  isFarming: boolean
  active: FarmingProgress[]
  queue: GameWithDrops[]
  completed: CompletedFarm[]
}

export const DEFAULT_FARMING_STATE: FarmingState = {
  isFarming: false,
  active: [],
  queue: [],
  completed: [],
}

// Mirrors src-tauri/src/card_farming/settings.rs::DropSortOrder - a two-option preference (like
// inventory-manager's PricePreference), not two independent booleans.
export type DropSortOrder = 'highestFirst' | 'lowestFirst'

// Mirrors src-tauri/src/card_farming/settings.rs::CardFarmingSettings. Blacklisting now lives in
// its own list (`CardFarmingBlacklistEntry`/`useCardFarmingBlacklist`, backed by its own file) -
// see that Rust struct's doc comment for why it's not a field here.
export interface CardFarmingSettings {
  listGames: boolean
  allGames: boolean
  skipNoPlaytime: boolean
  farmUnplayedOnly: boolean
  dropSortOrder: DropSortOrder
  nextTaskCheckbox: boolean
  nextTask: string | null
  autoFarmCards: boolean
}
