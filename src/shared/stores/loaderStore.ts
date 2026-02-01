import { create } from 'zustand'

interface LoaderStore {
  visible: boolean
  fadeOut: boolean
  showLoader: () => void
  hideLoader: () => void
}

export const useLoaderStore = create<LoaderStore>(set => ({
  visible: false,
  fadeOut: false,
  showLoader: () => set({ visible: true, fadeOut: false }),
  hideLoader: () => {
    set({ fadeOut: true })
    setTimeout(() => set({ visible: false }), 250)
  },
}))
