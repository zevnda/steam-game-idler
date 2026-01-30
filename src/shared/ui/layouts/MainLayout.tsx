import { Outlet } from 'react-router'

import { ErrorBoundaryProvider } from '../providers/ErrorBoundaryProvider'

export const MainLayout = () => {
  return (
    <ErrorBoundaryProvider>
      <Outlet />
    </ErrorBoundaryProvider>
  )
}
