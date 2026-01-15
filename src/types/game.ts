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
