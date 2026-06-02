export interface Game {
  appid: number
  name: string
  startTime?: number
  pid?: number
  playtime_forever?: number
  remaining?: number
}

export interface GameWithRemainingDrops {
  id: number
  name: string
  remaining: number
  playtime: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  iconLocked: string
  iconNormal: string
  achieved: boolean
  flags: string
  hidden: boolean
  percent: number
  permission: number
  protected_achievement: boolean
  skip?: boolean
  delayNextUnlock?: number
}

export interface Statistic {
  id: string
  name: string
  value: number
  flags: string
  increment_only: boolean
  stat_type: string
  permission: number
  protected_stat: boolean
}

export interface AchievementData {
  achievements: Achievement[]
  stats: Statistic[]
}

export interface StatValue {
  name: string
  value: number
}

export interface ChangedStats {
  [key: string]: number
}
