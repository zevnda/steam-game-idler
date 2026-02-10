import { create } from 'zustand'

interface globalStore {
  downloadUrl: string
  setDownloadUrl: (value: string | ((prev: string) => string)) => void
  latestVersion: string
  setLatestVersion: (value: string | ((prev: string) => string)) => void
  repoStars: number
  setRepoStars: (value: number | ((prev: number) => number)) => void
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
  repoStars: 400,
  setRepoStars: value =>
    set(state => ({
      repoStars: typeof value === 'function' ? value(state.repoStars) : value,
    })),
}))
