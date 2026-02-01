import { create } from 'zustand'
import type { UserSummary } from '../types'

interface UserStore {
  steamUsers: UserSummary[]
  setSteamUsers: (value: UserSummary[] | ((prevState: UserSummary[]) => UserSummary[])) => void
  userSummary: UserSummary
  setUserSummary: (value: UserSummary | ((prevState: UserSummary) => UserSummary)) => void
  isPro: boolean | null
  setIsPro: (value: boolean | null | ((prev: boolean | null) => boolean | null)) => void
}

export const useUserStore = create<UserStore>(set => ({
  steamUsers: [],
  setSteamUsers: value =>
    set(state => ({
      steamUsers: typeof value === 'function' ? value(state.steamUsers) : value,
    })),
  userSummary: {
    steamId: '',
    personaName: '',
    avatar: '',
  },
  setUserSummary: value =>
    set(state => ({
      userSummary: typeof value === 'function' ? value(state.userSummary) : value,
    })),
  isPro: null,
  setIsPro: value =>
    set(state => ({
      isPro: typeof value === 'function' ? value(state.isPro) : value,
    })),
}))
