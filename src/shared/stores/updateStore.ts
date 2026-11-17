import { create } from 'zustand'

interface UpdateStore {
  updateAvailable: boolean
  setUpdateAvailable: (value: boolean) => void
  // Whether UpdateLoader covers the app. Stays true after a failed attempt, so the loader can show
  // its error state - only a successful relaunch or the user's "continue without updating" clears it.
  isUpdating: boolean
  setIsUpdating: (value: boolean) => void
  // The current attempt failed (check, download stall, or install). UpdateLoader swaps its progress
  // bar for an error message with retry/continue buttons while this is set.
  updateFailed: boolean
  setUpdateFailed: (value: boolean) => void
  // Download progress from 0 to 1, or null while the size isn't known yet (the bar shows
  // indeterminate until then).
  downloadProgress: number | null
  setDownloadProgress: (value: number | null) => void
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
  updateFailed: false,
  setUpdateFailed: value => set({ updateFailed: value }),
  downloadProgress: null,
  setDownloadProgress: value => set({ downloadProgress: value }),
  showChangelog: false,
  setShowChangelog: value => set({ showChangelog: value }),
  initialCheckSettled: false,
  setInitialCheckSettled: value => set({ initialCheckSettled: value }),
}))
