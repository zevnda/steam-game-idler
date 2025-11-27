import type { ReactElement, ReactNode } from 'react'

import { useUserStore } from '@/stores/userStore'

import { SupabaseProvider } from '@/components/contexts/SupabaseContext'

function AppProviderInner({ children }: { children: ReactNode }): ReactElement {
  const { userSummary } = useUserStore()

  return <SupabaseProvider userSummary={userSummary}>{children}</SupabaseProvider>
}

export default function AppProvider({ children }: { children: ReactNode }): ReactElement {
  return <AppProviderInner>{children}</AppProviderInner>
}
