import type { ReactElement } from 'react'
import Layout from '@/shared/layouts/Layout'
import Window from '@/shared/layouts/Window'
import ErrorBoundaryProvider from '@/shared/providers/ErrorBoundaryProvider'
import I18nProvider from '@/shared/providers/I18nProvider'

export default function Index(): ReactElement {
  return (
    <ErrorBoundaryProvider>
      <I18nProvider>
        <Layout>
          <Window />
        </Layout>
      </I18nProvider>
    </ErrorBoundaryProvider>
  )
}
