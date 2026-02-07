import { create } from 'zustand'

interface LoaderStore {
  loaderVisible: boolean
  loaderFadeOut: boolean
  showLoader: () => void
  hideLoader: () => void
}

export const useLoaderStore = create<LoaderStore>(set => ({
  loaderVisible: true,
  loaderFadeOut: false,
  showLoader: () => set({ loaderVisible: true, loaderFadeOut: false }),
  hideLoader: () => {
    set({ loaderFadeOut: true })
    setTimeout(() => set({ loaderVisible: false }), 250)
  },
}))
