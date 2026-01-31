import { Outlet } from 'react-router'

import { ErrorBoundaryProvider } from '@/shared/ui/providers/ErrorBoundaryProvider'

export const MainLayout = () => {
  return (
    <ErrorBoundaryProvider>
      <div className='bg-base pt-9'>
        <Outlet />
      </div>
    </ErrorBoundaryProvider>
  )
}
