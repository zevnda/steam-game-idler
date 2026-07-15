import { create } from 'zustand'

interface UpdateStore {
  updateAvailable: boolean
  setUpdateAvailable: (value: boolean) => void
  isUpdating: boolean
  setIsUpdating: (value: boolean) => void
  showChangelog: boolean
  setShowChangelog: (value: boolean) => void
}

export const useUpdateStore = create<UpdateStore>(set => ({
  updateAvailable: false,
  setUpdateAvailable: value => set({ updateAvailable: value }),
  isUpdating: false,
  setIsUpdating: value => set({ isUpdating: value }),
  showChangelog: false,
  setShowChangelog: value => set({ showChangelog: value }),
}))
