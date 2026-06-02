import type { Achievement, Game, GameWithRemainingDrops, Statistic } from './games'
import type { UserSettings } from './settings'
import type { UserSummary } from './user'

interface RunningProcess {
  appid: number
  name: string
  pid: number
}

export interface InvokeUsers {
  error?: string
  users: UserSummary[]
}

export interface InvokeSettings {
  success: boolean
  settings: UserSettings
}

export interface InvokeIdle {
  error?: string
  success: string
}

export interface InvokeKillProcess {
  success: boolean
  killed_count?: number
}

export interface InvokeRunningProcess {
  processes: RunningProcess[]
}

export interface InvokeUserSummary {
  response: {
    players: {
      steamid: string
      personaname: string
      avatar: string
    }[]
  }
}

export interface InvokeValidateSession {
  user: string | null
}

export interface InvokeValidateKey {
  error?: string
  response?: { players?: unknown[] }
}

export interface InvokeFreeGames {
  games: Game[]
}

export interface InvokeRedeemFreeGame {
  success: boolean
  message?: string
}

export interface InvokeCustomList {
  error?: string
  list_data: Game[]
}

export interface InvokeGamesList {
  games_list: Game[]
  recent_games: Game[]
}

export interface InvokeAchievementData {
  achievement_data: {
    achievements: Achievement[]
    stats: Statistic[]
  }
}

export interface InvokeAchievementUnlock {
  success: string
}

export interface InvokeStatUpdate {
  success: string
}

export interface InvokeResetStats {
  success: string
}

export interface InvokeDropsRemaining {
  error?: string
  remaining: number
}

export interface InvokeGamesWithDrops {
  error?: string
  gamesWithDrops: GameWithRemainingDrops[]
}

export interface InvokeSteamCredentials {
  sessionid: string
  steamLoginSecure: string
  steamParental?: string
  steamMachineAuth?: string
  success: boolean
  message?: string
}
