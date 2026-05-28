import { create } from 'zustand'

interface UpdateStore {
  updateAvailable: boolean
  setUpdateAvailable: (value: boolean | ((prev: boolean) => boolean)) => void
  showChangelog: boolean
  setShowChangelog: (value: boolean | ((prev: boolean) => boolean)) => void
  isUpdating: boolean
  setIsUpdating: (value: boolean) => void
}

export const useUpdateStore = create<UpdateStore>(set => ({
  updateAvailable: false,
  setUpdateAvailable: value =>
    set(state => ({
      updateAvailable: typeof value === 'function' ? value(state.updateAvailable) : value,
    })),
  showChangelog: false,
  setShowChangelog: value =>
    set(state => ({
      showChangelog: typeof value === 'function' ? value(state.showChangelog) : value,
    })),
  isUpdating: false,
  setIsUpdating: value => set({ isUpdating: value }),
}))
