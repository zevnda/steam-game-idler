import { create } from 'zustand'

export type CurrentOs = 'windows' | 'linux'

interface PlatformStore {
  // `null` means "not yet checked" (see usePlatform, mounted once at root in `_app.tsx`). Every
  // consumer treats `null` the same as "windows" (the only OS this app shipped on before Linux
  // support existed) - a gate here only ever hides/rewords something for a confirmed `'linux'`
  // read, never for an unresolved one, so a slow/failed check fails open onto pre-existing
  // Windows-only behavior instead of flashing Linux-only UI at everyone for a frame.
  currentOs: CurrentOs | null
  setCurrentOs: (os: CurrentOs) => void
}

export const usePlatformStore = create<PlatformStore>(set => ({
  currentOs: null,
  setCurrentOs: os => set({ currentOs: os }),
}))
