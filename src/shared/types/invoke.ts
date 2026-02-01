import type { UserSummary } from './user'

export interface InvokeUsers {
  users: UserSummary[]
  error?: string
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
