import type { VersionPolicyStatus } from '@/shared/utils/versionPolicy'
import { create } from 'zustand'

// Written only by `useVersionPolicy` (mounted once, at the `_app.tsx` gate). `checking` is the
// startup state before the first policy check resolves - the gate renders nothing else until then.
interface VersionPolicyStore {
  status: VersionPolicyStatus | 'checking'
  currentVersion: string | null
  // Session-only: the "update soon" nag comes back on the next launch, by design
  outdatedDismissed: boolean
  setResult: (status: VersionPolicyStatus, currentVersion: string | null) => void
  dismissOutdated: () => void
}

export const useVersionPolicyStore = create<VersionPolicyStore>(set => ({
  status: 'checking',
  currentVersion: null,
  outdatedDismissed: false,
  setResult: (status, currentVersion) => set({ status, currentVersion }),
  dismissOutdated: () => set({ outdatedDismissed: true }),
}))
