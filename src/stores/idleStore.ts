import type { Game } from '@/types'

import { create } from 'zustand'

interface IdleStore {
  idleGamesList: Game[]
  setIdleGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void
}

export const useIdleStore = create<IdleStore>(set => ({
  idleGamesList: [],
  setIdleGamesList: value =>
    set(state => ({
      idleGamesList: typeof value === 'function' ? value(state.idleGamesList) : value,
    })),
}))
