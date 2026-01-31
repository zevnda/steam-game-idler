import { create } from 'zustand'
import type { UserSummary } from '../types'

interface Store {
  userSummary: UserSummary
  setUserSummary: (value: UserSummary | ((prevState: UserSummary) => UserSummary)) => void
  isPro: boolean | null
  setIsPro: (value: boolean | null | ((prev: boolean | null) => boolean | null)) => void
}

export const useUserStore = create<Store>(set => ({
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
