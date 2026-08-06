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

// Mirrors `card_farming::CardFarmingWhitelistEntry` - one entry in the account's card-farming
// whitelist (see `card_farming::whitelist`'s doc comment). When non-empty, `start_farming` only
// ever farms games with drops remaining that are also on this list - it has no ordering of its own,
// only scope.
export interface CardFarmingWhitelistEntry {
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
  // Unix millis when this game most recently entered `active` and has stayed continuously present
  // there since - see `FarmingProgress::active_since`'s doc comment (Rust side). Consumed by
  // `useCardFarmingActiveSince`/the on-card idling timer merge, not by anything in this feature's
  // own UI directly.
  activeSince: number
}

// Mirrors src-tauri/src/card_farming/mod.rs::Phase.
export type FarmingPhase = 'readyFarm' | 'bulkIdle'

// Mirrors src-tauri/src/card_farming/mod.rs::CompletedFarmReason.
export type CompletedFarmReason =
  'dropsExhausted' | 'noDropsRemaining' | 'refundWindow' | 'skippedUnplayed' | 'skippedPlayed'

// Mirrors src-tauri/src/card_farming/mod.rs::CompletedFarm.
export interface CompletedFarm {
  appId: number
  name: string
  remaining: number
  reason: CompletedFarmReason
  // Only set when `reason` is `'refundWindow'` - unix seconds after which this game is expected
  // to exit Steam's refund window and become eligible again.
  farmableAt: number | null
}

export interface FarmingState {
  isFarming: boolean
  // Which phase produced `active` - `null` only when the cycle isn't running at all.
  phase: FarmingPhase | null
  active: FarmingProgress[]
  queue: GameWithDrops[]
  completed: CompletedFarm[]
  // Set once by the running cycle on a confirmed mid-cycle Steam Community session expiry - see
  // `FarmingState::session_expired`'s doc comment. A hard stop, distinct from the cycle just
  // finishing normally.
  sessionExpired: boolean
}

export const DEFAULT_FARMING_STATE: FarmingState = {
  isFarming: false,
  phase: null,
  active: [],
  queue: [],
  completed: [],
  sessionExpired: false,
}

// Mirrors src-tauri/src/card_farming/settings.rs::CardFarmingSettings. Blacklisting/whitelisting
// each live in their own list (own file, own commands) - see those Rust structs' doc comments for
// why they're not fields here. Ordering is never user-configurable - the app always picks
// automatically (fewest drops remaining first while farming, closest to `hoursUntilFarmable` first
// while accumulating playtime).
export interface CardFarmingSettings {
  skipNoPlaytime: boolean
  farmUnplayedOnly: boolean
  nextTaskCheckbox: boolean
  nextTask: string | null
  autoFarmCards: boolean
  // Whether the user has dismissed the one-time "farming multiple games at once can slow down
  // drops" notice shown from the `allowMultiGameFarming` settings toggle.
  multiGameFarmingNoticeSeen: boolean
  // Agent-mode only - see `card_farming::settings::CardFarmingSettings::skip_refundable_games`'s
  // doc comment. A no-op for CLI-mode accounts (no purchase-date data exists for them).
  skipRefundableGames: boolean
  // Opt-in: idle every currently-ready game simultaneously instead of solo-targeting just the one
  // with the fewest drops remaining. Off by default and gated behind the one-time warning above -
  // idling more than one game with real card drops remaining at once measurably collapses each
  // one's drop rate.
  allowMultiGameFarming: boolean
  // Hours of playtime a game needs before its card drops are considered reachable.
  hoursUntilFarmable: number
}
