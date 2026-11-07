import { create } from 'zustand'

interface UpdateStore {
  updateAvailable: boolean
  setUpdateAvailable: (value: boolean) => void
  isUpdating: boolean
  setIsUpdating: (value: boolean) => void
  showChangelog: boolean
  setShowChangelog: (value: boolean) => void
  // This launch's first update check has finished without starting an install (nothing found,
  // skipped, or failed). An install never gets here: it ends with the app restarting. Lets
  // anything that shouldn't appear over an imminent restart (LegacyInstallPrompt) wait for it.
  initialCheckSettled: boolean
  setInitialCheckSettled: (value: boolean) => void
}

export const useUpdateStore = create<UpdateStore>(set => ({
  updateAvailable: false,
  setUpdateAvailable: value => set({ updateAvailable: value }),
  isUpdating: false,
  setIsUpdating: value => set({ isUpdating: value }),
  showChangelog: false,
  setShowChangelog: value => set({ showChangelog: value }),
  initialCheckSettled: false,
  setInitialCheckSettled: value => set({ initialCheckSettled: value }),
}))
