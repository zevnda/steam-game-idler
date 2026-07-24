import { create } from 'zustand'

interface globalStore {
  downloadUrl: string
  setDownloadUrl: (value: string | ((prev: string) => string)) => void
  latestVersion: string
  setLatestVersion: (value: string | ((prev: string) => string)) => void
  downloadSize: string
  setDownloadSize: (value: string | ((prev: string) => string)) => void
  repoStars: number
  setRepoStars: (value: number | ((prev: number) => number)) => void
  totalDownloads: string
  setTotalDownloads: (value: string | ((prev: string) => string)) => void
  totalDownloadsRaw: number
  setTotalDownloadsRaw: (value: number | ((prev: number) => number)) => void
  totalGames: number
  setTotalGames: (value: number | ((prev: number) => number)) => void
  // Linux release assets - all default to '' until a real Linux release exists (the CI pipeline
  // only started publishing these alongside the Windows installer once Linux support shipped).
  // .deb is the primary/recommended Linux format (see CLAUDE.md's Platform scope) - .rpm and
  // AppImage are offered as secondary links wherever a Linux download is shown.
  linuxDownloadUrl: string
  setLinuxDownloadUrl: (value: string | ((prev: string) => string)) => void
  linuxDownloadSize: string
  setLinuxDownloadSize: (value: string | ((prev: string) => string)) => void
  linuxRpmUrl: string
  setLinuxRpmUrl: (value: string | ((prev: string) => string)) => void
  linuxAppImageUrl: string
  setLinuxAppImageUrl: (value: string | ((prev: string) => string)) => void
  // The Windows portable zip - offered as a secondary link alongside the primary NSIS installer,
  // same pattern as .rpm/AppImage alongside the primary .deb. Defaults to '' until the release
  // asset is fetched (see StoreLoader.tsx).
  windowsPortableUrl: string
  setWindowsPortableUrl: (value: string | ((prev: string) => string)) => void
  // Which platform's download CTA to show, site-wide. Defaults to 'windows' (matches the
  // historical, pre-Linux-support behavior and is SSR-safe) until either a one-time client-side
  // OS sniff (see detectOS.ts, run once from OSDetector.tsx) or a manual toggle says otherwise.
  selectedOS: 'windows' | 'linux'
  setSelectedOS: (value: 'windows' | 'linux') => void
  // True once the user has manually picked a platform via a toggle - stops OSDetector's one-time
  // auto-detect effect from ever overwriting their explicit choice.
  osOverridden: boolean
  overrideOS: (value: 'windows' | 'linux') => void
}

export const useGlobalStore = create<globalStore>(set => ({
  downloadUrl: 'https://github.com/zevnda/steam-game-idler/releases/latest',
  setDownloadUrl: value =>
    set(state => ({
      downloadUrl: typeof value === 'function' ? value(state.downloadUrl) : value,
    })),
  latestVersion: '0.0.0',
  setLatestVersion: value =>
    set(state => ({
      latestVersion: typeof value === 'function' ? value(state.latestVersion || '') : value,
    })),
  downloadSize: '',
  setDownloadSize: value =>
    set(state => ({
      downloadSize: typeof value === 'function' ? value(state.downloadSize) : value,
    })),
  repoStars: 400,
  setRepoStars: value =>
    set(state => ({
      repoStars: typeof value === 'function' ? value(state.repoStars) : value,
    })),
  totalDownloads: '',
  setTotalDownloads: value =>
    set(state => ({
      totalDownloads: typeof value === 'function' ? value(state.totalDownloads) : value,
    })),
  totalDownloadsRaw: 0,
  setTotalDownloadsRaw: value =>
    set(state => ({
      totalDownloadsRaw: typeof value === 'function' ? value(state.totalDownloadsRaw) : value,
    })),
  totalGames: 150000,
  setTotalGames: value =>
    set(state => ({
      totalGames: typeof value === 'function' ? value(state.totalGames) : value,
    })),
  linuxDownloadUrl: '',
  setLinuxDownloadUrl: value =>
    set(state => ({
      linuxDownloadUrl: typeof value === 'function' ? value(state.linuxDownloadUrl) : value,
    })),
  linuxDownloadSize: '',
  setLinuxDownloadSize: value =>
    set(state => ({
      linuxDownloadSize: typeof value === 'function' ? value(state.linuxDownloadSize) : value,
    })),
  linuxRpmUrl: '',
  setLinuxRpmUrl: value =>
    set(state => ({
      linuxRpmUrl: typeof value === 'function' ? value(state.linuxRpmUrl) : value,
    })),
  linuxAppImageUrl: '',
  setLinuxAppImageUrl: value =>
    set(state => ({
      linuxAppImageUrl: typeof value === 'function' ? value(state.linuxAppImageUrl) : value,
    })),
  windowsPortableUrl: '',
  setWindowsPortableUrl: value =>
    set(state => ({
      windowsPortableUrl: typeof value === 'function' ? value(state.windowsPortableUrl) : value,
    })),
  selectedOS: 'windows',
  setSelectedOS: value => set({ selectedOS: value }),
  osOverridden: false,
  overrideOS: value => set({ selectedOS: value, osOverridden: true }),
}))
