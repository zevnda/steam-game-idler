import type { ReactElement, ReactNode } from 'react'

import { IdleProvider } from '@/components/contexts/IdleContext'
import { NavigationProvider } from '@/components/contexts/NavigationContext'
import { PluginProvider } from '@/components/contexts/PluginContext'
import { SearchProvider } from '@/components/contexts/SearchContext'
import { StateProvider } from '@/components/contexts/StateContext'
import { UpdateProvider } from '@/components/contexts/UpdateContext'
import { UserProvider } from '@/components/contexts/UserContext'

export default function AppProvider({ children }: { children: ReactNode }): ReactElement {
  return (
    <StateProvider>
      <IdleProvider>
        <SearchProvider>
          <NavigationProvider>
            <UserProvider>
              <UpdateProvider>
                <PluginProvider>{children}</PluginProvider>
              </UpdateProvider>
            </UserProvider>
          </NavigationProvider>
        </SearchProvider>
      </IdleProvider>
    </StateProvider>
  )
}
