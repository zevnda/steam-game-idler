import { create } from 'zustand'

interface SteamWarningStore {
  // Set by `useSteamMonitor` when the backend reports the local Steam client has closed. Reset
  // back to `false` by `SteamWarning` itself once its own 1s poll observes Steam running again -
  // not by the event listener, so recovery is detected even if the backend's push event is missed
  // for any reason (mirrors `main`'s SteamWarning.tsx exactly).
  showSteamWarning: boolean
  setShowSteamWarning: (show: boolean) => void
}

export const useSteamWarningStore = create<SteamWarningStore>(set => ({
  showSteamWarning: false,
  setShowSteamWarning: show => set({ showSteamWarning: show }),
}))
