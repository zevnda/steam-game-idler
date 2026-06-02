import type { ActivePageType } from '@/shared/types'

export const MAX_IDLE_PROCESSES = 32

export const FARMING_DELAYS = {
  farming: 60000 * 30,
  short: 15000,
  medium: 60000,
  long: 60000 * 5,
} as const

export const AUTO_IDLE_RETRY_MAX = 3
export const AUTO_IDLE_RETRY_DELAY_MS = 5000
export const AUTO_IDLE_CHECK_INTERVAL_MS = 10000
export const AUTO_IDLE_STEAM_WAIT_TIMEOUT_MS = 5 * 60 * 1000
export const AUTO_IDLE_STEAM_WAIT_READY_DELAY_MS = 15000

export const GAMES_LIST_AUTO_UPDATE_COOLDOWN_MS = 15 * 60 * 1000
export const GAMES_LIST_AUTO_UPDATE_KEY = 'gamesListLastAutoUpdate'

export const GRANDFATHER_CUTOFF = new Date('2026-04-10')

export const SIDEBAR_PAGES: ActivePageType[] = [
  'games',
  'idling',
  'customlists/favorites',
  'freeGames',
  'customlists/card-farming',
  'customlists/achievement-unlocker',
  'customlists/auto-idle',
  'inventoryManager',
]
