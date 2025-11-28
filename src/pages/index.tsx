import type { ReactElement } from 'react'

import { useUserStore } from '@/stores/userStore'

import { SupabaseProvider } from '@/components/chat/SupabaseContext'
import ErrorBoundary from '@/components/layout/ErrorBoundary'
import Layout from '@/components/layout/Layout'
import Window from '@/components/layout/Window'
import I18nProvider from '@/components/ui/i18n/I18nProvider'

export default function Index(): ReactElement {
  const userSummary = useUserStore(state => state.userSummary)

  return (
    <ErrorBoundary>
      <I18nProvider>
        <Layout>
          <SupabaseProvider userSummary={userSummary}>
            <Window />
          </SupabaseProvider>
        </Layout>
      </I18nProvider>
    </ErrorBoundary>
  )
}
