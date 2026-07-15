import type { AchievementUnlockerSettings } from '@/features/achievement-unlocker/types'
import type { CardFarmingSettings } from '@/features/card-farming/types'
import type { FreeGamesSettings } from '@/features/free-games/types'
import type { InventorySettings } from '@/features/inventory-manager/types'

// Mirrors src-tauri/src/settings/mod.rs's `Settings` (serde `rename_all = "camelCase"`).
export interface Settings {
  agentAccounts: Record<string, string>
  steamWebApiKey: string | null
  antiAway: boolean
  startMinimized: boolean
  closeToTray: boolean
  autoUpdateGamesList: boolean
  freeGameNotifications: boolean
  theme: string
  font: string
  customBackground: string | null
  disableTooltips: boolean
  showRecommendedCarousel: boolean
  showRecentCarousel: boolean
}

// Mirrors src-tauri/src/debug/commands.rs::SystemInfo.
export interface SystemInfo {
  osVersion: string
  arch: string
}

// Mirrors src-tauri/src/debug/commands.rs::ResetSettingsResult.
export interface ResetSettingsResult {
  settings: Settings
  achievementUnlockerSettings: AchievementUnlockerSettings | null
  inventorySettings: InventorySettings | null
  cardFarmingSettings: CardFarmingSettings | null
  freeGamesSettings: FreeGamesSettings | null
}

// Mirrors src-tauri/src/steam_community/mod.rs::SteamCookies. Each cookie-authenticated feature
// keeps its own copy of this shape rather than a shared frontend type - see
// features/inventory-manager/types.ts's identical comment for the precedent this follows.
export interface SteamCookies {
  sid: string
  sls: string
  sma?: string
}

// Mirrors src-tauri/src/steam_agent/presence_settings.rs's `PersonaState` (a plain, externally
// tagged unit enum - serde serializes each variant as its bare name, no `rename_all`).
export type PersonaState =
  | 'Online'
  | 'Busy'
  | 'Away'
  | 'Snooze'
  | 'LookingToTrade'
  | 'LookingToPlay'
  | 'Invisible'
  | 'Offline'

// Mirrors src-tauri/src/steam_agent/presence_settings.rs's `PresenceSettings` (serde
// `rename_all = "camelCase"`). Agent-mode only - see that module's doc comment.
export interface PresenceSettings {
  personaState: PersonaState
  customIdleStatus: string | null
}
