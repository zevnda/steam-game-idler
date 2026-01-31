import { Navigate, Outlet } from 'react-router'

import { FullScreenLoader } from '@/shared/ui'

export const RequireAuth = () => {
  // const { isAuthenticated, isLoading } = useAuth()
  // Example (change localstorage items for test)
  const isAuthenticated = localStorage.getItem('auth/isAuthenticated')
  const isLoading = localStorage.getItem('auth/isLoading')

  if (!isAuthenticated && !isLoading) {
    return <Navigate to='/signin' replace />
  }

  if (isLoading) {
    return <FullScreenLoader />
  }

  return <Outlet />
}
