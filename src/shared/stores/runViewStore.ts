import { create } from 'zustand'

export type RunView = 'overview' | 'details'
export type RunViewFeature = 'cardFarming' | 'achievementUnlocker'

interface RunViewStore {
  views: Record<RunViewFeature, RunView>
  // The run each feature's chosen view belongs to, by its start time - see `syncRun`
  runStartedAt: Record<RunViewFeature, number>
  setView: (feature: RunViewFeature, view: RunView) => void
  // Called with the current run's start time: a different run than last time resets to Overview
  syncRun: (feature: RunViewFeature, startedAtMs: number) => void
}

// Which tab (Overview or Details) each feature's running screen shows. Remembered for the rest of
// the same run, so leaving the page and coming back keeps the view you picked; every new run starts
// on Overview again.
export const useRunViewStore = create<RunViewStore>(set => ({
  views: { cardFarming: 'overview', achievementUnlocker: 'overview' },
  runStartedAt: { cardFarming: 0, achievementUnlocker: 0 },
  setView: (feature, view) => set(state => ({ views: { ...state.views, [feature]: view } })),
  syncRun: (feature, startedAtMs) =>
    set(state =>
      state.runStartedAt[feature] === startedAtMs
        ? state
        : {
            views: { ...state.views, [feature]: 'overview' },
            runStartedAt: { ...state.runStartedAt, [feature]: startedAtMs },
          },
    ),
}))
