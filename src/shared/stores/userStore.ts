import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSummary } from '../types'

interface UserStore {
  steamUsers: UserSummary[]
  setSteamUsers: (value: UserSummary[] | ((prevState: UserSummary[]) => UserSummary[])) => void
  userSummary: UserSummary
  selectedUser: UserSummary | null
  setSelectedUser: (
    value: UserSummary | null | ((prevState: UserSummary | null) => UserSummary | null),
  ) => void
  setUserSummary: (value: UserSummary | ((prevState: UserSummary) => UserSummary)) => void
  isPro: boolean | null
  setIsPro: (value: boolean | null | ((prev: boolean | null) => boolean | null)) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
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
      selectedUser: null,
      setSelectedUser: value =>
        set(state => ({
          selectedUser: typeof value === 'function' ? value(state.selectedUser) : value,
        })),
      setUserSummary: value =>
        set(state => ({
          userSummary: typeof value === 'function' ? value(state.userSummary) : value,
        })),
      isPro: null,
      setIsPro: value =>
        set(state => ({
          isPro: typeof value === 'function' ? value(state.isPro) : value,
        })),
    }),
    {
      name: 'user-storage',
      partialize: state => ({ userSummary: state.userSummary }),
    },
  ),
)
