import type { ReactElement, ReactNode } from 'react'

import { IdleProvider } from '@/components/contexts/IdleContext'
import { NavigationProvider } from '@/components/contexts/NavigationContext'
import { SearchProvider } from '@/components/contexts/SearchContext'
import { StateProvider } from '@/components/contexts/StateContext'
import { SupabaseProvider } from '@/components/contexts/SupabaseContext'
import { UpdateProvider } from '@/components/contexts/UpdateContext'
import { UserProvider, useUserContext } from '@/components/contexts/UserContext'

function AppProviderInner({ children }: { children: ReactNode }): ReactElement {
  const { userSummary } = useUserContext()

  return (
    <SupabaseProvider userSummary={userSummary}>
      <UpdateProvider>{children}</UpdateProvider>
    </SupabaseProvider>
  )
}

export default function AppProvider({ children }: { children: ReactNode }): ReactElement {
  return (
    <StateProvider>
      <IdleProvider>
        <SearchProvider>
          <NavigationProvider>
            <UserProvider>
              <AppProviderInner>{children}</AppProviderInner>
            </UserProvider>
          </NavigationProvider>
        </SearchProvider>
      </IdleProvider>
    </StateProvider>
  )
}
