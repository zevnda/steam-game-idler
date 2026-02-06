import { Layout, Window } from '@/shared/layouts'
import { ErrorBoundaryProvider, I18nProvider } from '@/shared/providers'

const Index = () => {
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

export default Index
