import type { Game } from '@/shared/types'
import { create } from 'zustand'

interface SessionStore {
  idleGamesList: Game[]
  isCardFarming: boolean
  isAchievementUnlocker: boolean
  updateAvailable: boolean
  showChangelog: boolean
  isUpdating: boolean
  loaderVisible: boolean
  loaderFadeOut: boolean

  setIdleGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void
  setIsCardFarming: (value: boolean) => void
  setIsAchievementUnlocker: (value: boolean) => void
  setUpdateAvailable: (value: boolean) => void
  setShowChangelog: (value: boolean) => void
  setIsUpdating: (value: boolean) => void
  showLoader: () => void
  hideLoader: () => void
}

export const useSessionStore = create<SessionStore>(set => ({
  idleGamesList: [],
  isCardFarming: false,
  isAchievementUnlocker: false,
  updateAvailable: false,
  showChangelog: false,
  isUpdating: false,
  loaderVisible: true,
  loaderFadeOut: false,

  setIdleGamesList: value =>
    set(state => ({
      idleGamesList: typeof value === 'function' ? value(state.idleGamesList) : value,
    })),
  setIsCardFarming: value => set({ isCardFarming: value }),
  setIsAchievementUnlocker: value => set({ isAchievementUnlocker: value }),
  setUpdateAvailable: value => set({ updateAvailable: value }),
  setShowChangelog: value => set({ showChangelog: value }),
  setIsUpdating: value => set({ isUpdating: value }),
  showLoader: () => set({ loaderVisible: true, loaderFadeOut: false }),
  hideLoader: () => {
    set({ loaderFadeOut: true })
    setTimeout(() => set({ loaderVisible: false }), 250)
  },
}))
